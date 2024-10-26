import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { Team } from "../models/Team.js";
import mongoose from "mongoose";

export const eventController = {
	async createEvent(req, res) {
		try {
			const {
				name,
				type,
				description,
				location,
				startDate,
				endDate,
				questions,
				maxParticipants,
			} = req.body;

			if (!name || !type || !description || !startDate || !endDate) {
				return res.status(400).json({
					error: "Missing required fields",
				});
			}

			const start = new Date(startDate);
			const end = new Date(endDate);

			if (start >= end) {
				return res.status(400).json({
					error: "End date must be after start date",
				});
			}

			if (start < new Date()) {
				return res.status(400).json({
					error: "Start date cannot be in the past",
				});
			}

			if (type === "online") {
				if (!questions?.length) {
					return res.status(400).json({
						error: "Online events require questions",
					});
				}

				for (const question of questions) {
					if (
						!question.question ||
						!question.answer ||
						!question.options?.length
					) {
						return res.status(400).json({
							error:
								"Invalid question format. Each question must have question text, answer, and options",
						});
					}

					if (!question.options.includes(question.answer)) {
						return res.status(400).json({
							error: "Answer must be one of the options provided",
						});
					}
				}
			}

			if (type === "offline") {
				if (!location) {
					return res.status(400).json({
						error: "Offline events require a location",
					});
				}
				if (!maxParticipants || maxParticipants <= 0) {
					return res.status(400).json({
						error:
							"Offline events require a valid maximum number of participants",
					});
				}
			}

			const event = new Event({
				name,
				type,
				description,
				location,
				startDate,
				endDate,
				questions:
					type === "online" ? questions.map((q) => ({ ...q, points: 10 })) : [],
				maxParticipants: type === "offline" ? maxParticipants : null,
				currentParticipants: 0,
				status: "upcoming",
			});

			await event.save();
			res.status(201).json(event);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	},
	async updateEvent(req, res) {
		try {
			const { eventId } = req.params;
			const updatedEvent = await Event.findByIdAndUpdate(eventId, req.body, {
				new: true,
			});
			if (!updatedEvent) {
				return res.status(404).json({ error: "Event not found" });
			}
			res.json(updatedEvent);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	},

	async deleteEvent(req, res) {
		try {
			const { eventId } = req.params;
			const deletedEvent = await Event.findByIdAndDelete(eventId);
			if (!deletedEvent) {
				return res.status(404).json({ error: "Event not found" });
			}
			res.json({ message: "Event deleted successfully" });
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	},

	async getEvents(req, res) {
		try {
			const { type, status, search } = req.query;
			let query = {};

			if (type) query.type = type;
			if (status) query.status = status;
			if (search) {
				query.$or = [
					{ name: { $regex: search, $options: "i" } },
					{ description: { $regex: search, $options: "i" } },
				];
			}

			const events = await Event.find(query)
				.populate({
					path: "participants.user",
					select: "username email",
				})
				.populate({
					path: "participants.team",
					select: "name",
				})
				.sort({ startDate: 1 })
				.lean();

			const eventsWithParticipants = events.map((event) => {
				const currentParticipants = event.participants.reduce(
					(total, participant) => {
						return total + (participant.team ? event.teamSize || 1 : 1);
					},
					0,
				);

				return {
					...event,
					currentParticipants,
				};
			});

			res.json(eventsWithParticipants);
		} catch (error) {
			console.error("Error fetching events:", error);
			res.status(500).json({
				error: "Failed to fetch events",
				details: error.message,
			});
		}
	},

	async getEventById(req, res) {
		try {
			const event = await Event.findById(req.params.eventId)
				.populate("participants.user", "username email")
				.populate("participants.team", "name");

			if (!event) {
				return res.status(404).json({ error: "Event not found" });
			}

			if (req.user.role !== "admin") {
				event.questions = event.questions.map((q) => ({
					...q.toObject(),
					answer: undefined,
				}));
			}

			res.json(event);
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	},

	submitAnswers: async (req, res) => {
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			const { eventId } = req.params;
			const { answers } = req.body;
			const userId = req.user._id;

			const event = await Event.findById(eventId).session(session);
			if (!event) {
				await session.abortTransaction();
				return res.status(404).json({ error: "Event not found" });
			}

			const participant = event.participants.find(
				(p) => p.user.toString() === userId.toString(),
			);

			if (!participant) {
				await session.abortTransaction();
				return res.status(404).json({ error: "Participant not found" });
			}

			if (participant.hasCompleted) {
				await session.abortTransaction();
				return res
					.status(400)
					.json({ error: "You have already completed this event" });
			}

			const now = new Date();
			if (now < event.startDate || now > event.endDate) {
				await session.abortTransaction();
				return res
					.status(403)
					.json({ error: "Event is not active for submissions" });
			}

			let totalScore = 0;
			const correctAnswers = [];

			if (
				!Array.isArray(answers) ||
				!answers.every((a) => a.questionId && a.answer)
			) {
				await session.abortTransaction();
				return res.status(400).json({ error: "Invalid answers format" });
			}

			answers.forEach(({ questionId, answer }) => {
				const question = event.questions.find(
					(q) => q._id.toString() === questionId,
				);

				if (!question) {
					throw new Error(`Question ${questionId} not found`);
				}

				const isCorrect = question.answer === answer;

				if (isCorrect) {
					totalScore += question.points;
					correctAnswers.push(questionId);
				}

				participant.answers.push({
					question: questionId,
					answer,
					isCorrect,
					submittedAt: new Date(),
				});
			});

			const perfectRun = correctAnswers.length === event.questions.length;
			participant.score = totalScore;
			participant.perfectRun = perfectRun;
			participant.hasCompleted = true;

			const user = await User.findById(userId).session(session);
			if (!user) {
				await session.abortTransaction();
				return res.status(404).json({ error: "User not found" });
			}

			user.score = (user.score || 0) + totalScore;
			if (perfectRun) {
				user.wins = (user.wins || 0) + 1;
			}

			if (user.participationType === "team" && user.teamId) {
				const team = await Team.findById(user.teamId).session(session);
				if (team) {
					team.score = (team.score || 0) + totalScore;
					if (perfectRun) {
						team.wins = (team.wins || 0) + 1;
					}

					const eventParticipation = {
						event: eventId,
						score: totalScore,
						participantCount: team.members.length,
						completedAt: new Date(),
					};

					if (!Array.isArray(team.eventsParticipated)) {
						team.eventsParticipated = [];
					}

					const existingEventIndex = team.eventsParticipated.findIndex(
						(ep) => ep.event.toString() === eventId.toString(),
					);

					if (existingEventIndex >= 0) {
						team.eventsParticipated[existingEventIndex] = eventParticipation;
					} else {
						team.eventsParticipated.push(eventParticipation);
					}

					await team.save({ session });
				}
			}

			await event.save({ session });
			await user.save({ session });

			await session.commitTransaction();

			res.json({
				score: totalScore,
				correctAnswers,
				perfectRun,
				teamUpdated: user.participationType === "team",
			});
		} catch (error) {
			console.error("Error submitting answers:", error);
			await session.abortTransaction();
			res.status(500).json({ error: "Failed to submit answers" });
		} finally {
			session.endSession();
		}
	},

	getTeamStats: async (req, res) => {
		try {
			const { teamId } = req.params;
			const team = await Team.findById(teamId).populate(
				"eventsParticipated.event",
				"name type",
			);

			if (!team) {
				return res.status(404).json({ error: "Team not found" });
			}

			res.json({
				teamName: team.name,
				totalScore: team.score,
				totalWins: team.wins,
				averageScore: team.averageEventScore,
				memberCount: team.memberCount,
				eventsParticipated: team.eventsParticipated,
			});
		} catch (error) {
			console.error("Error fetching team stats:", error);
			res.status(500).json({ error: "Failed to fetch team statistics" });
		}
	},
	subscribeToEvent: async (req, res) => {
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			const { eventId } = req.params;
			const { type, teamId } = req.body;
			const userId = req.user._id;

			const event = await Event.findById(eventId)
				.populate({
					path: "participants.team",
					populate: {
						path: "members.user",
						model: "User",
					},
				})
				.populate("participants.user")
				.session(session);

			if (!event) {
				await session.abortTransaction();
				return res.status(404).json({ error: "Event not found" });
			}

			if (event.type !== "offline") {
				await session.abortTransaction();
				return res
					.status(400)
					.json({ error: "This endpoint is for offline events only" });
			}

			// Fixed user registration check
			const isUserRegistered = event.participants.some((p) => {
				if (p.registrationType === "individual" && p.user) {
					const participantId = p.user._id
						? p.user._id.toString()
						: p.user.toString();
					return participantId === userId.toString();
				}
				return false;
			});

			if (isUserRegistered) {
				await session.abortTransaction();
				return res
					.status(400)
					.json({ error: "You are already registered for this event" });
			}

			let participantData;
			let participantsToAdd = 1;

			if (type === "team" && teamId) {
				const team = await Team.findById(teamId)
					.populate("members.user")
					.session(session);

				if (!team) {
					await session.abortTransaction();
					return res.status(404).json({ error: "Team not found" });
				}

				// Check if team is already registered
				const isTeamRegistered = event.participants.some(
					(p) => p.team && p.team._id.toString() === teamId,
				);

				if (isTeamRegistered) {
					await session.abortTransaction();
					return res
						.status(400)
						.json({ error: "Your team is already registered for this event" });
				}

				// Use event.teamSize or default to 5 if not specified
				participantsToAdd = event.teamSize || team.members.length || 5;

				participantData = {
					team: teamId,
					registeredBy: userId,
					registrationType: "team",
				};
			} else {
				participantData = {
					user: userId,
					registeredBy: userId,
					registrationType: "individual",
				};
			}

			// Check available spots
			const currentTotal = event.currentParticipants || 0;
			if (currentTotal + participantsToAdd > event.maxParticipants) {
				await session.abortTransaction();
				return res.status(400).json({
					error:
						type === "team"
							? "Not enough spots available for the entire team"
							: "No spots available for registration",
				});
			}

			// Update event with new participant
			event.participants.push(participantData);
			event.currentParticipants = currentTotal + participantsToAdd;

			await event.save({ session });
			await session.commitTransaction();

			return res.json({
				message: `Successfully registered ${
					type === "team" ? "team" : "participant"
				} for the event`,
				currentParticipants: event.currentParticipants,
				maxParticipants: event.maxParticipants,
			});
		} catch (error) {
			await session.abortTransaction();
			console.error("Error subscribing to event:", error);
			res.status(500).json({
				error: "Failed to register for the event",
				details: error.message,
			});
		} finally {
			session.endSession();
		}
	},

	async getTeamEventStandings(req, res) {
		try {
			const { eventId } = req.params;

			const event = await Event.findById(eventId)
				.populate("participants.user", "username teamId")
				.populate("participants.team", "name");

			if (!event) {
				return res.status(404).json({ error: "Event not found" });
			}

			const teamScores = {};
			event.participants.forEach((participant) => {
				if (participant.team) {
					const teamId = participant.team._id.toString();
					if (!teamScores[teamId]) {
						teamScores[teamId] = {
							teamId,
							teamName: participant.team.name,
							totalScore: 0,
							perfectRuns: 0,
							participantCount: 0,
						};
					}
					teamScores[teamId].totalScore += participant.score;
					if (participant.perfectRun) teamScores[teamId].perfectRuns += 1;
					teamScores[teamId].participantCount += 1;
				}
			});

			const standings = Object.values(teamScores)
				.sort((a, b) => b.totalScore - a.totalScore)
				.map((team, index) => ({
					...team,
					rank: index + 1,
					averageScore: team.totalScore / team.participantCount,
				}));

			res.json({
				eventName: event.name,
				teamStandings: standings,
			});
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	},

	async registerForOfflineEvent(req, res) {
		try {
			const { eventId } = req.params;
			const userId = req.user._id;

			const event = await Event.findById(eventId);
			if (!event) {
				return res.status(404).json({ error: "Event not found" });
			}

			if (event.type !== "offline") {
				return res.status(400).json({ error: "This is not an offline event" });
			}

			const now = new Date();
			if (now > new Date(event.startDate)) {
				return res.status(400).json({ error: "Registration period has ended" });
			}

			if (event.currentParticipants >= event.maxParticipants) {
				return res.status(400).json({ error: "Event is full" });
			}

			const isRegistered = event.participants.some(
				(p) => p.user.toString() === userId.toString(),
			);

			if (isRegistered) {
				return res
					.status(400)
					.json({ error: "Already registered for this event" });
			}

			event.participants.push({ user: userId });
			event.currentParticipants += 1;
			await event.save();

			res.json({
				message: "Successfully registered for event",
				event: {
					name: event.name,
					startDate: event.startDate,
					location: event.location,
				},
			});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	},

	async getEventLeaderboard(req, res) {
		try {
			const { eventId } = req.params;

			const event = await Event.findById(eventId).populate(
				"participants.user",
				"username email",
			);

			if (!event) {
				return res.status(404).json({ error: "Event not found" });
			}

			const leaderboard = event.participants
				.sort((a, b) => b.score - a.score)
				.map((p) => ({
					username: p.user.username,
					score: p.score,
					perfectRun: p.perfectRun,
					completedAt: p.answers[p.answers.length - 1]?.submittedAt,
				}));

			res.json({
				eventName: event.name,
				leaderboard,
			});
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	},

	async getUserEventHistory(req, res) {
		try {
			const userId = req.user._id;

			const events = await Event.find({
				"participants.user": userId,
			});

			const history = events.map((event) => ({
				eventId: event._id,
				eventName: event.name,
				type: event.type,
				date: event.startDate,
				score:
					event.participants.find(
						(p) => p.user.toString() === userId.toString(),
					)?.score || 0,
				perfectRun:
					event.participants.find(
						(p) => p.user.toString() === userId.toString(),
					)?.perfectRun || false,
				status: event.participants.find(
					(p) => p.user.toString() === userId.toString(),
				)?.hasCompleted
					? "completed"
					: "registered",
			}));

			res.json(history);
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	},
	async participateInEvent(req, res) {
		try {
			const { eventId } = req.params;
			const userId = req.user._id;

			const event = await Event.findById(eventId);
			if (!event) {
				return res.status(404).json({ error: "Event not found" });
			}

			if (event.type !== "online") {
				return res.status(400).json({ error: "This is not an online event" });
			}

			const now = new Date();
			if (now < new Date(event.startDate) || now > new Date(event.endDate)) {
				return res
					.status(400)
					.json({ error: "This Event Hasn't Started yet, Pls Wait 😁" });
			}

			const existingParticipation = event.participants.find(
				(p) => p.user.toString() === userId.toString(),
			);

			if (existingParticipation && existingParticipation.hasCompleted) {
				return res.status(400).json({ error: "You Can't Submit Twice Bro 😑" });
			}

			if (!existingParticipation) {
				event.participants.push({
					user: userId,
					registrationType: "individual", // Add this
					registeredBy: userId, // Add this
					hasCompleted: false,
					score: 0,
					perfectRun: false,
					answers: [],
				});
				await event.save();
			}

			const sanitizedQuestions = event.questions.map((q) => ({
				_id: q._id,
				question: q.question,
				options: q.options,
				points: q.points,
			}));

			res.status(200).json({
				_id: event._id,
				name: event.name,
				type: event.type,
				description: event.description,
				startDate: event.startDate,
				endDate: event.endDate,
				questions: sanitizedQuestions,
			});
		} catch (error) {
			console.error("Participation error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	},
};

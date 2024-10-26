import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import Navbar from "./Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Separate components for better organization

const ResultsCard = ({ results, onBack }) => (
	<div
		className={`mb-6 p-6 rounded-lg ${
			results.perfectRun ? "bg-green-100" : "bg-blue-50"
		}`}
	>
		<h2 className="text-xl font-bold mb-4">Results</h2>
		<div className="space-y-2">
			<p className="text-lg">
				Score: <span className="font-semibold">{results.score}</span>
			</p>
			<p className="text-lg">
				Correct Answers:{" "}
				<span className="font-semibold">{results.correctAnswers}</span> /{" "}
				<span className="font-semibold">{results.totalQuestions}</span>
			</p>
			{results.perfectRun && (
				<div className="mt-4 text-green-600 font-bold text-lg animate-bounce">
					🎉 PERFECT RUN! 🎉
				</div>
			)}
		</div>
		<button
			onClick={onBack}
			className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
						transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
		>
			Back to Events
		</button>
	</div>
);

const UserGuide = () => (
	<div className="p-6 bg-blue-50 border border-blue-100 rounded-lg mb-6 shadow-sm">
		<h2 className="text-2xl font-semibold mb-3 text-blue-800">
			👋 Welcome to Your Event Hub!
		</h2>

		<p className="text-gray-700 mb-4">
			We're excited to have you here! This is your one-stop destination for all
			events and activities. Here's how you can make the most of your
			experience:
		</p>

		<div className="space-y-4">
			{[
				{
					icon: "🎯",
					title: "Discover Events",
					description:
						"Browse through our exciting collection of online and in-person events. Each card shows you all the important details like date, location, and available spots.",
				},
				{
					icon: "👥",
					title: "Join In",
					description:
						"Ready to participate? Just click the blue button on any event card! You can join as an individual or with your team - we've got options for everyone.",
				},
				{
					icon: "✨",
					title: "Online Challenges",
					description:
						"Taking part in an online event? You'll get interactive questions to answer. Take your time, select your answers, and submit when you're ready!",
				},
				{
					icon: "🌟",
					title: "Track Your Success",
					description:
						"After completing an event, you'll see your score and achievements right away. Get a perfect score? We've got a special celebration waiting for you! 🎉",
				},
			].map(({ icon, title, description }, index) => (
				<div key={index} className="flex items-start space-x-3">
					<div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
						<span className="text-blue-600 text-lg">{icon}</span>
					</div>
					<div>
						<h3 className="font-medium text-blue-900">{title}</h3>
						<p className="text-gray-600">{description}</p>
					</div>
				</div>
			))}
		</div>

		<div className="mt-6 pt-4 border-t border-blue-100">
			<p className="text-gray-600">
				<span className="font-medium text-blue-800">Need help?</span> Call Me
				Right Away 🤙🏼📞
			</p>
		</div>
	</div>
);

const EventCard = ({ event, onParticipate, user }) => {
	const currentParticipants = calculateCurrentParticipants(event);
	const alreadyRegistered = isAlreadyRegistered(event, user);
	const requiredSpots = user.teamId
		? event.teamSize || user?.team?.members?.length || 1
		: 1;
	const notEnoughSpots =
		currentParticipants + requiredSpots > event.maxParticipants;

	const buttonText = alreadyRegistered
		? "Already Registered"
		: event.type === "online"
		? "Participate"
		: `Register ${user.teamId ? "Team" : ""}`;

	const isDisabled =
		event.type === "offline" && (alreadyRegistered || notEnoughSpots);

	return (
		<div className="bg-white p-6 rounded-lg shadow-lg flex flex-col justify-between">
			<div>
				<h3 className="text-xl font-bold mb-2">{event.name}</h3>
				<p className="text-gray-600 mb-2">
					Type: {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
				</p>
				<p className="mb-2">{event.description}</p>
				{event.type === "offline" && (
					<div className="mb-2">
						<p>Location: {event.location}</p>
						<p>
							Participants: {currentParticipants} / {event.maxParticipants}
						</p>
					</div>
				)}
				<p className="text-sm text-gray-500 mb-4">
					{formatDate(event.startDate)} - {formatDate(event.endDate)}
				</p>
			</div>
			<button
				onClick={() => onParticipate(event._id)}
				disabled={isDisabled}
				className={`w-full py-2 rounded transition-colors duration-200 ${
					isDisabled
						? "bg-gray-400 cursor-not-allowed"
						: "bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
				} text-white`}
			>
				{buttonText}
			</button>
		</div>
	);
};

// Utility functions
const calculateCurrentParticipants = (event) => {
	if (!event?.participants) return 0;
	return event.participants.reduce(
		(total, participant) =>
			total + (participant.registrationType === "team" ? 5 : 1),
		0,
	);
};

const isAlreadyRegistered = (event, user) => {
	if (!event?.participants || !user?._id) return false;

	return event.participants.some((p) => {
		if (p.registrationType === "individual") {
			const participantId =
				typeof p.user === "object"
					? p.user._id?.toString()
					: p.user?.toString();
			return participantId === user._id.toString();
		}
		return (
			p.registrationType === "team" && p.team?._id?.toString() === user.teamId
		);
	});
};

const formatDate = (date) => new Date(date).toLocaleDateString();

// Main component
const Dashboard = () => {
	const { user } = useAuth();
	const [events, setEvents] = useState([]);
	const [activeEvent, setActiveEvent] = useState(null);
	const [answers, setAnswers] = useState({});
	const [results, setResults] = useState(null);

	const showErrorToast = (message) => {
		toast.error(message, {
			position: "top-right",
			autoClose: 4000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: "light",
		});
	};

	const showSuccessToast = (message) => {
		toast.success(message, {
			position: "top-right",
			autoClose: 4000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: "light",
		});
	};

	const fetchEvents = useCallback(async () => {
		try {
			const response = await api.get("/events");
			setEvents(response.data);
		} catch (err) {
			console.error("Failed to fetch events:", err);
			// showErrorToast("Failed to load events. Please try again later.");
		}
	}, []);

	const fetchUserStats = useCallback(async () => {
		try {
			await api.get("/events/user/history");
		} catch (err) {
			console.error("Failed to fetch user stats:", err);
			// showErrorToast("Failed to load user statistics.");
		}
	}, []);

	const fetchTeamStats = useCallback(async () => {
		if (!user?.teamId) return;
		try {
			await api.get(`/events/${user.teamId}/stats`);
		} catch (err) {
			console.error("Failed to fetch team stats:", err);
			// showErrorToast("Failed to load team statistics.");
		}
	}, [user?.teamId]);

	// Effect hooks remain the same...
	useEffect(() => {
		fetchEvents();
		fetchUserStats();
	}, [fetchEvents, fetchUserStats]);

	useEffect(() => {
		fetchTeamStats();
	}, [fetchTeamStats]);

	// Handler functions
	const handleParticipate = async (eventId) => {
		try {
			const event = events.find((e) => e._id === eventId);
			if (!event) throw new Error("Event not found");

			if (event.type === "offline") {
				const payload = {
					type: user.teamId ? "team" : "individual",
					...(user.teamId && { teamId: user.teamId }),
				};

				const response = await api.post(
					`/events/${eventId}/subscribe`,
					payload,
				);
				showSuccessToast(response.data.message);
				await fetchEvents();
			} else {
				const response = await api.post(`/events/${eventId}/participate`);
				if (response.data) {
					setActiveEvent(response.data);
					setAnswers({});
					setResults(null);
				}
			}
		} catch (err) {
			const errorMessage =
				err.response?.data?.error ||
				err.message ||
				"Failed to join the event. Please try again.";
			showErrorToast(errorMessage);
		}
	};

	const handleAnswerChange = (questionId, answer) => {
		setAnswers((prev) => ({ ...prev, [questionId]: answer }));
	};

	const handleSubmit = async () => {
		try {
			if (
				!activeEvent?.questions?.length ||
				activeEvent.questions.length !== Object.keys(answers).length
			) {
				showErrorToast("Please answer all questions before submitting.");
				return;
			}

			const formattedAnswers = Object.entries(answers).map(
				([questionId, answer]) => ({
					questionId,
					answer,
				}),
			);

			const response = await api.post(`/events/${activeEvent._id}/submit`, {
				answers: formattedAnswers,
				teamId: user.teamId,
			});

			setResults({
				totalQuestions: activeEvent.questions.length,
				correctAnswers: formattedAnswers.filter((a) =>
					response.data.correctAnswers?.includes(a.questionId),
				).length,
				score: response.data.score,
				perfectRun: response.data.perfectRun,
			});

			if (response.data.perfectRun) {
				showSuccessToast("🎉 Perfect Score! Congratulations!");
			} else {
				showSuccessToast("Answers submitted successfully!");
			}

			if (user.teamId) {
				await fetchTeamStats();
			}
		} catch (err) {
			console.error("Failed to submit answers:", err);
			showErrorToast(
				err.response?.data?.error ||
					"Failed to submit answers. Please try again.",
			);
		}
	};

	const handleBackToEvents = () => {
		setActiveEvent(null);
		setResults(null);
		setAnswers({});
	};

	// Render active event questions
	const renderActiveEvent = () => (
		<div className="bg-white p-6 rounded-lg shadow-lg">
			<h2 className="text-2xl font-bold mb-6">{activeEvent.name}</h2>
			<div className="space-y-6">
				{activeEvent.questions?.map((question, qIndex) => (
					<div
						key={question._id}
						className="border p-4 rounded-lg hover:border-blue-200 transition-colors duration-200"
					>
						<p className="font-medium mb-4 text-lg">
							{qIndex + 1}. {question.question}
						</p>
						<div className="space-y-3">
							{Array.isArray(question.options) &&
								question.options.map((option, index) => (
									<label
										key={index}
										className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
									>
										<input
											type="radio"
											name={`question-${question._id}`}
											value={option}
											onChange={(e) =>
												handleAnswerChange(question._id, e.target.value)
											}
											checked={answers[question._id] === option}
											className="form-radio h-4 w-4 text-blue-600"
										/>
										<span className="text-gray-700">{option}</span>
									</label>
								))}
						</div>
					</div>
				))}
				<button
					onClick={handleSubmit}
					className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
				>
					Submit Answers
				</button>
			</div>
		</div>
	);

	return (
		<div>
			<Navbar />
			<ToastContainer position="top-right" />
			<div className="container mx-auto mt-10 px-4">
				{results ? (
					<ResultsCard results={results} onBack={handleBackToEvents} />
				) : activeEvent ? (
					renderActiveEvent()
				) : (
					<div>
						<UserGuide />
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{events.map((event) => (
								<EventCard
									key={event._id}
									event={event}
									user={user}
									onParticipate={handleParticipate}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Dashboard;

import mongoose from "mongoose";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";

export const teamController = {
	async createTeam(req, res) {
        try {
            console.log("Creating team - User ID:", req.user._id);
            console.log("Team name:", req.body.name);

            // First, verify the user exists
            const user = await User.findById(req.user._id);
            if (!user) {
                console.log("User not found");
                return res.status(404).json({ error: "User not found" });
            }

            // Create the team
            const team = new Team({
                name: req.body.name,
                captain: req.user._id,
                members: [], // Captain will be automatically added by middleware
                score: 0
            });

            console.log("Created team object:", team);

            // Save the team
            const savedTeam = await team.save();
            console.log("Saved team:", savedTeam);

            // Update the user with the team ID
            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                {
                    teamId: savedTeam._id,
                    isCaptain: true,
                },
                { new: true }
            );

            console.log("Updated user:", updatedUser);

            // Fetch the complete team data
            const populatedTeam = await Team.findById(savedTeam._id)
                .populate('captain', 'username email')
                .populate('members.user', 'username email');

            console.log("Final populated team:", populatedTeam);

            res.status(201).json(populatedTeam);
        } catch (error) {
            console.error("Team creation error:", error);
            res.status(400).json({ error: error.message });
        }
    },

	async getTeamById(req, res) {
		try {
			// Check if the team ID is provided and is not null
			const { id } = req.params;
			if (!id || id === "null") {
				return res.status(400).json({ error: "Invalid team ID" });
			}

			// Validate if the ID is a valid ObjectId
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ error: "Invalid team ID format" });
			}

			// Fetch the team by ID
			const team = await Team.findById(id)
				.populate("members", "username email")
				.populate("captain", "username email");

			// Check if the team exists
			if (!team) {
				return res.status(404).json({ error: "Team not found" });
			}

			// Return the team data
			res.json(team);
		} catch (error) {
			console.error("Get team error:", error);
			res.status(500).json({ error: "Internal Server Error" });
		}
	},

	async addMember(req, res) {
		try {
			const { memberId } = req.body;
			const { teamId } = req.params;

			const team = await Team.findById(teamId);
			if (!team) {
				return res.status(404).json({ error: "Team not found" });
			}

			// Check if user is captain
			if (team.captain.toString() !== req.user._id.toString()) {
				return res.status(403).json({
					error: "Only the team captain can add members",
				});
			}

			// Add to active members if not already present
			if (!team.activeMembers.includes(memberId)) {
				team.activeMembers.push(memberId);
				await team.save();

				// Update user's team ID
				await User.findByIdAndUpdate(memberId, {
					teamId: team._id,
					participationType: "team",
				});
			}

			const updatedTeam = await Team.findById(teamId)
				.populate("activeMembers", "username email")
				.populate("captain", "username email");

			res.json(updatedTeam);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	},
	async getLeaderboard(req, res) {
		try {
			console.log("Fetching leaderboard...");

			// Find all teams and populate necessary fields
			const teams = await Team.find()
				.populate("captain", "username email")
				.populate("members", "name email")
				.sort({ score: -1 }) // Sort by score in descending order
				.lean() // Convert to plain JavaScript objects for better performance
				.exec();

			// Add rank to each team
			const rankedTeams = teams.map((team, index) => ({
				...team,
				rank: index + 1,
				score: team.score || 0, // Ensure score exists
				wins: team.wins || 0, // Ensure wins exists
				members: team.members || [], // Ensure members exists
				activeMembers: team.activeMembers || [], // Ensure activeMembers exists
			}));

			console.log("Teams fetched:", rankedTeams);
			res.json(rankedTeams);
		} catch (error) {
			console.error("Error fetching leaderboard:", error);
			res.status(500).json({
				error: "Internal Server Error",
				details: error.message,
			});
		}
	},
};

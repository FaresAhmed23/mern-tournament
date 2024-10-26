import { User } from "../models/User.js";
import { Team } from "../models/Team.js"; // Ensure Team is imported
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const userController = {
	async register(req, res) {
        try {
            const { 
                username, 
                email, 
                password, 
                participationType,
                teamName,
                teamMembers 
            } = req.body;

            // Validation
            if (!username || !email || !password || !participationType) {
                return res.status(400).json({ 
                    error: "All required fields must be provided" 
                });
            }

            // Email format validation
            const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    error: "Invalid email format" 
                });
            }

            // Username validation
            if (username.length < 3) {
                return res.status(400).json({ 
                    error: "Username must be at least 3 characters long" 
                });
            }

            // Password validation
            if (password.length < 6) {
                return res.status(400).json({ 
                    error: "Password must be at least 6 characters long" 
                });
            }

            // Check for existing user with more detailed error messages
            const existingUser = await User.findOne({ 
                $or: [{ email: email.toLowerCase() }, { username }]
            });

            if (existingUser) {
                return res.status(400).json({ 
                    error: existingUser.email.toLowerCase() === email.toLowerCase() ? 
                        "Email already registered" : 
                        "Username already taken" 
                });
            }

            if (participationType === "team") {
                if (!teamName) {
                    return res.status(400).json({ 
                        error: "Team name is required for team registration" 
                    });
                }

                const existingTeam = await Team.findOne({ 
                    name: { $regex: new RegExp(`^${teamName}$`, 'i') }
                });
                
                if (existingTeam) {
                    return res.status(400).json({ 
                        error: "Team name already taken" 
                    });
                }

                // Validate team members if provided
                if (teamMembers) {
                    for (const member of teamMembers) {
                        if (!member.name || !member.email) {
                            return res.status(400).json({ 
                                error: "All team members must have both name and email" 
                            });
                        }
                        if (!emailRegex.test(member.email)) {
                            return res.status(400).json({ 
                                error: `Invalid email format for team member: ${member.name}` 
                            });
                        }
                    }
                }
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const user = new User({
                username,
                email,
                password: hashedPassword,
                participationType,
                isCaptain: participationType === "team",
                role: "user"
            });

            const savedUser = await user.save();

            // If team registration, create team with formatted members
            if (participationType === "team" && teamName) {
                // Format team members, excluding any that match the captain
                const formattedMembers = teamMembers
                    ? teamMembers
                        .filter(member => member.email !== email) // Exclude captain's email
                        .map(member => ({
                            name: member.name,
                            email: member.email
                        }))
                    : [];

                const team = new Team({
                    name: teamName,
                    captain: savedUser._id,
                    members: formattedMembers // Captain will be added by middleware
                });

                const savedTeam = await team.save();

                // Update user with team ID
                savedUser.teamId = savedTeam._id;
                await savedUser.save();
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: savedUser._id },
                "secret",
                { expiresIn: "24h" }
            );

            res.status(201).json({
                message: "Registration successful",
                token,
                user: {
                    id: savedUser._id,
                    username: savedUser.username,
                    email: savedUser.email,
                    participationType: savedUser.participationType,
                    teamId: savedUser.teamId
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ 
                error: "Registration failed. Please try again." 
            });
        }
    },

	async login(req, res) {
		try {
			const { email, password } = req.body;
			const user = await User.findOne({ email });
			if (!user || !(await bcrypt.compare(password, user.password))) {
				return res.status(401).json({ error: "Invalid credentials" });
			}
			const token = jwt.sign({ userId: user._id }, "secret", {
				expiresIn: "24h",
			});
			res.json({
				token,
				user: {
					id: user._id,
					username: user.username,
					role: user.role,
					teamId: user.teamId,
					isCaptain: user.isCaptain,
				},
			});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	},
    async getUserProfile(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            res.json({
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                formattedRole: user.formattedRole,
                participationType: user.participationType,
                formattedParticipationType: user.formattedParticipationType,
                formattedPosition: user.formattedPosition,
                teamId: user.teamId,
                isCaptain: user.isCaptain
            });
        } catch (error) {
            res.status(500).json({ error: "Error fetching user profile" });
        }
    },
    async getUserStats(req, res) {
        try {
            // This is a placeholder - implement your actual stats logic here
            const stats = {
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                winRate: 0
            };

            // You would typically fetch these from your database
            // Example:
            // const games = await Game.find({ userId: req.user.id });
            // stats.gamesPlayed = games.length;
            // stats.wins = games.filter(game => game.won).length;
            // etc.

            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: "Error fetching user stats" });
        }
    },
    async getUsersLeaderboard(req, res) {
        try {
            const users = await User.find({ 
                participationType: 'individual',
                // Add any other relevant filters
            })
            .select('username email score wins participationType')
            .sort({ score: -1 });
    
            res.json(users);
        } catch (error) {
            console.error('Error fetching users leaderboard:', error);
            res.status(500).json({ error: 'Failed to fetch users leaderboard' });
        }
    },
};

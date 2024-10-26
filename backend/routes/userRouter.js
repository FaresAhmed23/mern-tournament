import express from "express";
import { userController } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
	res.json({
		id: req.user._id,
		username: req.user.username,
		email: req.user.email,
		teamId: req.user.teamId,
		isCaptain: req.user.isCaptain,
		role: req.user.role,
		formattedRole: req.user.formattedRole,
		participationType: req.user.participationType,
		formattedParticipationType: req.user.formattedParticipationType,
		formattedPosition: req.user.formattedPosition,
	});
});
router.get('/leaderboard', authMiddleware, userController.getUsersLeaderboard);
router.get("/stats", authMiddleware, userController.getUserStats);
router.get("/profile", authMiddleware, userController.getUserProfile);
router.post("/register", userController.register);
router.post("/login", userController.login);

export const userRouter = router;

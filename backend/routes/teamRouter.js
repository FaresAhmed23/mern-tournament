import express from "express";
import { teamController } from "../controllers/teamController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/leaderboard", teamController.getLeaderboard); // Move this before /:id route
router.post("/", authMiddleware, teamController.createTeam);
router.get('/:id', authMiddleware, teamController.getTeamById);
router.put("/:id", authMiddleware, teamController.addMember);

export const teamRouter = router;

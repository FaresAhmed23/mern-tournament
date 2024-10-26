import express from 'express';
import { eventController } from '../controllers/eventController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Existing routes
router.get('/', authMiddleware, eventController.getEvents);
router.get('/:eventId', authMiddleware, eventController.getEventById);
router.post('/:eventId/participate', authMiddleware, eventController.participateInEvent);
router.post('/:eventId/submit', authMiddleware, eventController.submitAnswers);
router.get('/:eventId/leaderboard', authMiddleware, eventController.getEventLeaderboard);
router.get('/user/history', authMiddleware, eventController.getUserEventHistory);
router.post('/:eventId/subscribe', authMiddleware, eventController.subscribeToEvent);

// New route for team standings
router.get('/:eventId/team-standings', authMiddleware, eventController.getTeamEventStandings);
router.get('/:teamId/stats', authMiddleware, eventController.getTeamStats);

// Admin routes
router.post('/', authMiddleware, eventController.createEvent);
router.put('/:eventId', authMiddleware, eventController.updateEvent);
router.delete('/:eventId', authMiddleware, eventController.deleteEvent);

export const eventRouter = router;
// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { userRouter } from "./routes/userRouter.js";
import { teamRouter } from "./routes/teamRouter.js";
import { eventRouter } from "./routes/eventRouter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { connectDB } from "./db/connectDB.js";
import bodyParser from "body-parser";
import helmet from "helmet";


dotenv.config();

const app = express();

connectDB();

// Middleware
app.use(helmet());
app.use(cors({
	origin: ["https://mern-tournament-aigt.vercel.app"],
	methods: ["POST", "GET"],
	credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRouter);
app.use("/api/teams", teamRouter);
app.use("/api/events", eventRouter);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

export default app;

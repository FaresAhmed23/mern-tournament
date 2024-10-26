import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
	try {
		const token = req.header("Authorization").replace("Bearer ", "");
		const decoded = jwt.verify(token, 'secret');
		const user = await User.findById(decoded.userId);

		if (!user) {
			throw new Error();
		}

		req.user = user;
		next();
	} catch (error) {
		res.status(401).send({ error: "Please authenticate." });
	}
};

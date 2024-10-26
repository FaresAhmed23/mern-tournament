import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		score: { type: Number, default: 0 },
		wins: { type: Number, default: 0 },
		role: {
			type: String,
			enum: ["admin", "user"],
			default: "user",
		},
		participationType: {
			type: String,
			enum: ["individual", "team"],
			required: true,
		},
		teamId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Team",
			default: null,
		},
		isCaptain: { type: Boolean, default: false },
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

// Add virtuals for formatted values
userSchema.virtual("formattedRole").get(function () {
	return this.role === "admin" ? "Administrator" : "Player";
});

userSchema.virtual("formattedParticipationType").get(function () {
	return this.participationType === "team"
		? "Team Player"
		: "Individual Player";
});

userSchema.virtual("formattedPosition").get(function () {
	if (this.participationType !== "team") return null;
	return this.isCaptain ? "Team Captain" : "Team Member";
});

export const User = mongoose.model("User", userSchema);

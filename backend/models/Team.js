import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: false },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    }
});

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    members: [teamMemberSchema],
    score: {
        type: Number,
        default: 0
    },
    wins: {
        type: Number,
        default: 0
    },
    eventsParticipated: [{
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event'
        },
        score: Number,
        participantCount: Number,
        completedAt: Date
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for average score per event
teamSchema.virtual('averageEventScore').get(function() {
    if (!this.eventsParticipated.length) return 0;
    const totalScore = this.eventsParticipated.reduce((sum, event) => sum + event.score, 0);
    return totalScore / this.eventsParticipated.length;
});

// Virtual for total members count
teamSchema.virtual('memberCount').get(function() {
    return this.members.length;
});

// Middleware to ensure captain is always a member
teamSchema.pre('save', async function(next) {
    try {
        if (!this.isNew && !this.isModified('captain')) {
            return next();
        }

        const User = mongoose.model('User');
        const captain = await User.findById(this.captain);

        if (!captain) {
            throw new Error('Captain user not found');
        }

        const isCaptainMember = this.members.some(
            member => member.email === captain.email || 
            (member.user && member.user.toString() === this.captain.toString())
        );

        if (!isCaptainMember) {
            this.members.unshift({
                name: captain.username,
                email: captain.email,
                user: captain._id
            });
        }

        next();
    } catch (error) {
        next(error);
    }
});

export const Team = mongoose.model("Team", teamSchema);
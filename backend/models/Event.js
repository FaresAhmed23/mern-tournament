import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    answer: { type: String, required: true },
    points: { type: Number, default: 10 }
});

const participantSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: function() {
            return this.registrationType === 'individual';
        }
    },
    team: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Team',
        required: function() {
            return this.registrationType === 'team';
        }
    },
    registeredBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    registrationType: { 
        type: String, 
        enum: ['individual', 'team'],
        required: true 
    },
    score: { type: Number, default: 0 },
    perfectRun: { type: Boolean, default: false },
    hasCompleted: { type: Boolean, default: false },
    answers: [{
        question: { type: mongoose.Schema.Types.ObjectId, required: true },
        answer: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        submittedAt: { type: Date, default: Date.now }
    }]
});

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['online', 'offline'],
        required: true 
    },
    description: { type: String, required: true },
    location: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    questions: [questionSchema],
    maxParticipants: { type: Number, default: 99 },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed'],
        default: 'upcoming'
    },
    participants: [participantSchema],
	currentParticipants: { 
        type: Number, 
        default: 0,
        validate: {
            validator: function(value) {
                return value <= this.maxParticipants;
            },
            message: 'Maximum participants limit exceeded'
        }
    },
    participants: [participantSchema],
    teamSize: { 
        type: Number, 
        default: 5,
        validate: {
            validator: function(value) {
                return value > 0;
            },
            message: 'Team size must be greater than 0'
        }
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ "participants.user": 1 });
eventSchema.index({ "participants.team": 1 });

export const Event = mongoose.model("Event", eventSchema);
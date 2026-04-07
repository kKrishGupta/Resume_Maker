const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  mode: {
    type: String,
    enum: ["ai", "practice"]
  },

  // 🔥 FIXED STRUCTURE
  history: [
    {
      question: String,
      answer: String,
      feedback: {
        clarity: Number,
        confidence: Number,
        technical: Number,
        strengths: [String],
        improvements: [String]
      },
      emotion: {
        confidenceLevel: String,
        stressLevel: String
      },
      score: Number,
      createdAt: Date
    }
  ],

  score: Number
}, { timestamps: true });

module.exports = mongoose.model("InterviewSession", sessionSchema);
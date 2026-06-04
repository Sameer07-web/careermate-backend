const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  interviewType: {
    type: String,
    enum: ['Technical', 'Behavioral', 'HR', 'System Design'],
    required: true
  },
  questions: [{
    questionText: String,
    userAnswer: String,
    aiFeedback: String,
    score: Number
  }],
  overallScore: Number,
  strengths: [String],
  weaknesses: [String]
}, {
  timestamps: true
});

interviewSessionSchema.index({ userId: 1 });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);

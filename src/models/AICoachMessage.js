const mongoose = require('mongoose');

const aiCoachMessageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AICoachSession',
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  metadata: {
    model: String,
    tokensUsed: Number
  }
}, {
  timestamps: true
});

aiCoachMessageSchema.index({ sessionId: 1, createdAt: 1 });

module.exports = mongoose.model('AICoachMessage', aiCoachMessageSchema);

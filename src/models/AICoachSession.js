const mongoose = require('mongoose');

const aiCoachSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  sessionType: {
    type: String,
    enum: ['career', 'resume', 'interview', 'roadmap', 'skills'],
    default: 'career'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

aiCoachSessionSchema.index({ userId: 1 });

module.exports = mongoose.model('AICoachSession', aiCoachSessionSchema);

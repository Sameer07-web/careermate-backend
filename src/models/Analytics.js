const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalApplications: { type: Number, default: 0 },
  rejections: { type: Number, default: 0 },
  interviews: { type: Number, default: 0 },
  offers: { type: Number, default: 0 },
  averageATSScore: { type: Number, default: 0 },
  lastResumeScore: { type: Number, default: 0 },
  completedRoadmaps: { type: Number, default: 0 },
  completedSkills: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

analyticsSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', analyticsSchema);

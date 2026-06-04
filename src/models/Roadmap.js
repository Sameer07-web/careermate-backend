const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetRole: {
    type: String,
    required: true
  },
  currentSkills: [String],
  completionPercentage: {
    type: Number,
    default: 0
  },
  estimatedWeeks: Number,
  generatedAt: {
    type: Date,
    default: Date.now
  },
  modules: [{
    title: String,
    description: String,
    topics: [String],
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  dsaTargets: [String],
  projectRecommendations: [String]
}, {
  timestamps: true
});

roadmapSchema.index({ userId: 1 });
roadmapSchema.index({ userId: 1, targetRole: 1 });

module.exports = mongoose.model('Roadmap', roadmapSchema);

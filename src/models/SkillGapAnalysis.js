const mongoose = require('mongoose');

const skillGapAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetRole: {
    type: String,
    required: true
  },
  resumeVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeVersion'
  },
  jobDescription: {
    type: String,
    required: true
  },
  missingSkills: [String],
  missingKeywords: [String],
  recommendedProjects: [String],
  recommendedResources: [String]
}, {
  timestamps: true
});

skillGapAnalysisSchema.index({ userId: 1 });

module.exports = mongoose.model('SkillGapAnalysis', skillGapAnalysisSchema);

const mongoose = require('mongoose');

const resumeVersionSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  mimeType: String,
  extractedText: String,
  analysis: {
    atsScore: Number,
    missingKeywords: [String],
    suggestions: [String],
    strengths: [String],
    weaknesses: [String],
    analyzedAt: Date
  }
}, {
  timestamps: true
});

resumeVersionSchema.index({ resumeId: 1 });
resumeVersionSchema.index({ resumeId: 1, versionNumber: -1 });

module.exports = mongoose.model('ResumeVersion', resumeVersionSchema);

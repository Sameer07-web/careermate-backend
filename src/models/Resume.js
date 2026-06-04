const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'My Resume'
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  primaryVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeVersion'
  }
}, {
  timestamps: true
});

resumeSchema.index({ userId: 1 });

module.exports = mongoose.model('Resume', resumeSchema);

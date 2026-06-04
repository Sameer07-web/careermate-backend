const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: [true, 'Please add a company name']
  },
  positionTitle: {
    type: String,
    required: [true, 'Please add a position title']
  },
  status: {
    type: String,
    enum: ['saved', 'applied', 'interviewing', 'offered', 'rejected'],
    default: 'saved'
  },
  applicationSource: {
    type: String,
    enum: ['LinkedIn', 'Naukri', 'Indeed', 'Referral', 'Company Website', 'Other']
  },
  dateApplied: Date,
  interviewDate: Date,
  recruiterName: String,
  jobUrl: String,
  location: String,
  salaryRange: String,
  notes: String,
  resumeVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeVersion'
  }
}, {
  timestamps: true
});

// Indexes
applicationSchema.index({ userId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);

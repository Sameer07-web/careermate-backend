const Resume = require('../models/Resume');
const ResumeVersion = require('../models/ResumeVersion');
const storageService = require('../services/storageService');
const resumeExtractor = require('../services/resumeExtractor');
const atsService = require('../services/atsService');
const User = require('../models/User');

// Helper for Background Analysis
const runBackgroundAnalysis = async (resumeVersionId, extractedText, userId) => {
  try {
    // Mark as processing
    await ResumeVersion.findByIdAndUpdate(resumeVersionId, { analysisStatus: 'processing' });
    
    // Get user profile for target role context
    const user = await User.findById(userId);
    const targetRole = user?.profile?.targetRole || 'Software Engineer';

    // Run ATS analysis
    const analysisResult = await atsService.analyzeResume(extractedText, targetRole);

    // Update version with results
    await ResumeVersion.findByIdAndUpdate(resumeVersionId, {
      analysisStatus: 'completed',
      analysis: analysisResult
    });
  } catch (error) {
    console.error(`Background analysis failed for version ${resumeVersionId}:`, error);
    await ResumeVersion.findByIdAndUpdate(resumeVersionId, { analysisStatus: 'failed' });
  }
};

// @desc    Upload new resume version
// @route   POST /api/resumes/upload
// @access  Private
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Please upload a PDF file' });
    }

    const userId = req.user.id;

    // 1. Store File
    const fileData = await storageService.saveFile(req.file);

    // 2. Find or Create Parent Resume
    let resume = await Resume.findOne({ userId });
    let versionNumber = 1;

    if (!resume) {
      resume = await Resume.create({
        userId,
        title: 'Primary Resume',
        isPrimary: true
      });
    } else {
      // Find latest version number
      const lastVersion = await ResumeVersion.findOne({ resumeId: resume._id }).sort({ versionNumber: -1 });
      versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;
    }

    // 3. Extract Text
    let extractedText = '';
    let uploadStatus = 'completed';
    try {
      extractedText = await resumeExtractor.extractText(req.file.buffer);
    } catch (extractError) {
      console.error('Extraction error:', extractError);
      uploadStatus = 'failed';
    }

    // 4. Create ResumeVersion Document
    const resumeVersion = await ResumeVersion.create({
      resumeId: resume._id,
      versionNumber,
      fileUrl: fileData.fileUrl,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize,
      mimeType: fileData.mimeType,
      extractedText,
      uploadStatus,
      analysisStatus: 'pending' // Initial status
    });

    // 4.5 Set as primary if it's the first version
    if (versionNumber === 1 || !resume.primaryVersionId) {
      resume.primaryVersionId = resumeVersion._id;
      await resume.save();
    }

    // 5. Return Success immediately
    res.status(201).json({
      status: 'success',
      data: resumeVersion,
      message: 'Resume uploaded successfully. Analysis is running in the background.'
    });

    // 6. Trigger Asynchronous Background Analysis (if extraction succeeded)
    if (uploadStatus === 'completed' && extractedText) {
      // We don't await this
      runBackgroundAnalysis(resumeVersion._id, extractedText, userId);
    } else {
      await ResumeVersion.findByIdAndUpdate(resumeVersion._id, { analysisStatus: 'failed' });
    }

  } catch (error) {
    next(error);
  }
};

// @desc    Get user's resume (parent object)
// @route   GET /api/resumes
// @access  Private
exports.getResumes = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id });
    if (!resume) {
      return res.status(200).json({ status: 'success', data: null });
    }

    res.status(200).json({
      status: 'success',
      data: resume
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all versions of a resume
// @route   GET /api/resumes/:id/versions
// @access  Private
exports.getResumeVersions = async (req, res, next) => {
  try {
    const resumeId = req.params.id;
    
    // Verify ownership
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ status: 'error', message: 'Resume not found' });
    }

    const versions = await ResumeVersion.find({ resumeId }).sort({ versionNumber: -1 });

    res.status(200).json({
      status: 'success',
      data: versions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific version details
// @route   GET /api/resumes/versions/:versionId
// @access  Private
exports.getVersionDetails = async (req, res, next) => {
  try {
    const version = await ResumeVersion.findById(req.params.versionId).populate('resumeId');
    if (!version) {
      return res.status(404).json({ status: 'error', message: 'Version not found' });
    }

    if (version.resumeId.userId.toString() !== req.user.id) {
      return res.status(401).json({ status: 'error', message: 'Not authorized' });
    }

    res.status(200).json({
      status: 'success',
      data: version
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a resume version
// @route   DELETE /api/resumes/versions/:versionId
// @access  Private
exports.deleteVersion = async (req, res, next) => {
  try {
    const version = await ResumeVersion.findById(req.params.versionId).populate('resumeId');
    if (!version) {
      return res.status(404).json({ status: 'error', message: 'Version not found' });
    }

    if (version.resumeId.userId.toString() !== req.user.id) {
      return res.status(401).json({ status: 'error', message: 'Not authorized' });
    }

    const resumeId = version.resumeId._id;
    
    // Check total versions
    const totalVersions = await ResumeVersion.countDocuments({ resumeId });
    if (totalVersions <= 1) {
      return res.status(400).json({ status: 'error', message: 'Cannot delete the only remaining version.' });
    }

    // Delete the file from storage
    if (version.fileUrl) {
      await storageService.deleteFile(version.fileUrl);
    }

    // Determine if it was the primary version (by some application logic if we store primaryVersionId on Resume)
    // We didn't add primaryVersionId on Resume schema (just isPrimary), so maybe all versions belong to the primary resume.
    // The requirement says: "Users can mark a version as primary". 
    // Wait, the `isPrimary` field is on `Resume.js`. 
    // To support a "Primary Version", we need a `primaryVersionId` on `Resume.js`.
    
    await version.deleteOne();

    // Check if we need to promote a new primary version
    const resume = await Resume.findById(resumeId);
    if (resume.primaryVersionId && resume.primaryVersionId.toString() === version._id.toString()) {
      // Promote newest version
      const newestVersion = await ResumeVersion.findOne({ resumeId }).sort({ versionNumber: -1 });
      resume.primaryVersionId = newestVersion._id;
      await resume.save();
    }

    res.status(200).json({ status: 'success', message: 'Version deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger re-analysis
// @route   POST /api/resumes/versions/:versionId/reanalyze
// @access  Private
exports.reanalyzeVersion = async (req, res, next) => {
  try {
    const version = await ResumeVersion.findById(req.params.versionId).populate('resumeId');
    if (!version) {
      return res.status(404).json({ status: 'error', message: 'Version not found' });
    }

    if (version.resumeId.userId.toString() !== req.user.id) {
      return res.status(401).json({ status: 'error', message: 'Not authorized' });
    }

    if (!version.extractedText) {
      return res.status(400).json({ status: 'error', message: 'No text was extracted for this version. Cannot analyze.' });
    }

    version.analysisStatus = 'pending';
    await version.save();

    // Async background task
    runBackgroundAnalysis(version._id, version.extractedText, req.user.id);

    res.status(200).json({ status: 'success', message: 'Re-analysis triggered in background.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Set primary version
// @route   PUT /api/resumes/versions/:versionId/primary
// @access  Private
exports.setPrimaryVersion = async (req, res, next) => {
  try {
    const version = await ResumeVersion.findById(req.params.versionId).populate('resumeId');
    if (!version) {
      return res.status(404).json({ status: 'error', message: 'Version not found' });
    }

    if (version.resumeId.userId.toString() !== req.user.id) {
      return res.status(401).json({ status: 'error', message: 'Not authorized' });
    }

    const resume = await Resume.findById(version.resumeId._id);
    resume.primaryVersionId = version._id;
    await resume.save();

    res.status(200).json({ status: 'success', message: 'Primary version updated', data: resume });
  } catch (error) {
    next(error);
  }
};

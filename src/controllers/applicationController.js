const Application = require('../models/Application');

// @desc    Get all applications for logged in user
// @route   GET /api/applications
// @access  Private
exports.getApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: applications.length,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
exports.getApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate('resumeVersionId');

    if (!application) {
      return res.status(404).json({ status: 'error', message: 'Application not found' });
    }

    // Make sure user owns the application
    if (application.userId.toString() !== req.user.id) {
      return res.status(401).json({ status: 'error', message: 'Not authorized to access this application' });
    }

    res.status(200).json({
      status: 'success',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new application
// @route   POST /api/applications
// @access  Private
exports.createApplication = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.userId = req.user.id;

    const application = await Application.create(req.body);

    res.status(201).json({
      status: 'success',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private
exports.updateApplication = async (req, res, next) => {
  try {
    let application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ status: 'error', message: 'Application not found' });
    }

    // Make sure user owns application
    if (application.userId.toString() !== req.user.id) {
      return res.status(401).json({ status: 'error', message: 'Not authorized to update this application' });
    }

    application = await Application.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private
exports.deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ status: 'error', message: 'Application not found' });
    }

    // Make sure user owns application
    if (application.userId.toString() !== req.user.id) {
      return res.status(401).json({ status: 'error', message: 'Not authorized to delete this application' });
    }

    await application.deleteOne();

    res.status(200).json({
      status: 'success',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

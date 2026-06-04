const express = require('express');
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All application routes are protected
router.use(protect);

router
  .route('/')
  .get(getApplications)
  .post(createApplication);

router
  .route('/:id')
  .get(getApplication)
  .put(updateApplication)
  .delete(deleteApplication);

module.exports = router;

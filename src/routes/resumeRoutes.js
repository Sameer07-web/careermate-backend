const express = require('express');
const {
  uploadResume,
  getResumes,
  getResumeVersions,
  getVersionDetails,
  deleteVersion,
  reanalyzeVersion,
  setPrimaryVersion
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.post('/upload', upload.single('resume'), uploadResume);
router.get('/', getResumes);
router.get('/:id/versions', getResumeVersions);
router.get('/versions/:versionId', getVersionDetails);
router.delete('/versions/:versionId', deleteVersion);
router.post('/versions/:versionId/reanalyze', reanalyzeVersion);
router.put('/versions/:versionId/primary', setPrimaryVersion);

module.exports = router;

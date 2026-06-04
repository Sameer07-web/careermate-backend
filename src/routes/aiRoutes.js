const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/authMiddleware');
const {
  startSession,
  getSessions,
  getMessages,
  sendMessage
} = require('../controllers/aiController');

const router = express.Router();

// Apply Rate Limiting for AI requests to protect Gemini usage
// 20 requests per 15 minutes per user IP
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  message: { status: 'error', message: 'Too many requests to AI Service. Please try again later.' }
});

router.use(protect);

router.post('/sessions', startSession);
router.get('/sessions', getSessions);
router.get('/sessions/:sessionId/messages', getMessages);

// Apply strict rate limiting on the actual message sending
router.post('/sessions/:sessionId/messages', aiLimiter, sendMessage);

module.exports = router;

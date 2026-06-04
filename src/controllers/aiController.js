const AICoachSession = require('../models/AICoachSession');
const AICoachMessage = require('../models/AICoachMessage');
const aiService = require('../services/aiService');

// @desc    Start a new AI Coach Session
// @route   POST /api/ai/sessions
// @access  Private
exports.startSession = async (req, res, next) => {
  try {
    const { sessionType, firstMessage } = req.body;
    
    // Auto-generate title if first message provided, else default
    let title = 'New Conversation';
    if (firstMessage) {
      title = await aiService.generateSessionTitle(firstMessage);
    }

    const session = await AICoachSession.create({
      userId: req.user.id,
      sessionType: sessionType || 'career',
      title
    });

    res.status(201).json({
      status: 'success',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active sessions for a user
// @route   GET /api/ai/sessions
// @access  Private
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await AICoachSession.find({ userId: req.user.id, isActive: true }).sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all messages in a session
// @route   GET /api/ai/sessions/:sessionId/messages
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const session = await AICoachSession.findOne({ _id: req.params.sessionId, userId: req.user.id });
    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Session not found' });
    }

    const messages = await AICoachMessage.find({ sessionId: session._id }).sort({ createdAt: 1 });

    res.status(200).json({
      status: 'success',
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message to the AI
// @route   POST /api/ai/sessions/:sessionId/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const sessionId = req.params.sessionId;

    const session = await AICoachSession.findOne({ _id: sessionId, userId: req.user.id });
    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Session not found' });
    }

    // 1. Save User Message
    const userMessage = await AICoachMessage.create({
      sessionId,
      sender: 'user',
      content
    });

    // 2. Fetch History (Up to last 10 messages for context)
    // We exclude the one we just saved, because we pass the new one separately to aiService.
    const history = await AICoachMessage.find({ sessionId })
      .sort({ createdAt: -1 })
      .skip(1) // skip the newly created user message
      .limit(10);
    
    // Reverse it to get chronological order for the AI model
    history.reverse();

    // 3. Call AI Service
    let aiResponseData;
    try {
      aiResponseData = await aiService.generateChatResponse(req.user.id, history, content);
    } catch (aiError) {
      console.error('AI Generation Error:', aiError);
      return res.status(500).json({ status: 'error', message: 'AI failed to respond. Please try again.' });
    }

    // 4. Save AI Message
    const aiMessage = await AICoachMessage.create({
      sessionId,
      sender: 'ai',
      content: aiResponseData.content,
      metadata: aiResponseData.metadata
    });

    // Update session timestamp
    session.updatedAt = new Date();
    // If it's still generic title, we could update it, but usually generated at start
    await session.save();

    res.status(201).json({
      status: 'success',
      data: {
        userMessage,
        aiMessage
      }
    });
  } catch (error) {
    next(error);
  }
};

const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators/authValidator');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/profile', protect, getProfile);
// Logout is handled client-side by destroying the token, but we can add an endpoint if we implement token blacklisting
router.post('/logout', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

module.exports = router;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON payloads

// Routes
const authRoutes = require('./routes/authRoutes');

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'CareerMate API is running' });
});

app.use('/api/auth', authRoutes);

// Error Handler Middleware (must be the last middleware)
app.use(errorHandler);

module.exports = app;

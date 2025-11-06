const express = require('express');
const serverless = require('serverless-http');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./lib/db');
const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

// Connect DB once per container
connectDB().then(() => console.log('✅ MongoDB connected (auth.js)')).catch(console.error);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Auth Error:', err.stack);
  res.status(500).json({ error: 'Auth service error' });
});

module.exports = serverless(app);

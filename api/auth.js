const express = require('express');
const serverless = require('serverless-http');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./lib/db');
const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Enable if you're using cookies/sessions
}));
app.use('/api/auth', authRoutes);

// Connect DB once per container
connectDB().then(() => console.log('✅ MongoDB connected (auth.js)')).catch(console.error);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Auth Error:', err.stack);
  res.status(500).json({ error: 'Auth service error' });
});

module.exports = serverless(app);

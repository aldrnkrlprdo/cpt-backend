const express = require('express');
const serverless = require('serverless-http');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

// ...existing code...
const connectDB = require('./lib/db');
const userRoutes = require('./routes/user.routes');

const app = express();
app.use(express.json());
app.use(cookieParser());

// CORS setup (use ALLOWED_ORIGINS env var, comma-separated)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('CORS policy: Origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Handle preflight quickly on Vercel serverless routes
app.options('*', cors(corsOptions));

// Apply CORS to all routes
app.use(cors(corsOptions));

app.use('/api/users', userRoutes);

connectDB().then(() => console.log('✅ MongoDB connected (users.js)')).catch(console.error);

app.use((err, req, res, next) => {
  console.error('User Error:', err.stack || err.message);
  // If CORS error, return 403
  if (err && err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({ error: 'User service error' });
});

module.exports = serverless(app);
// server.js
const express = require('express');
const serverless = require('serverless-http');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./lib/db');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();

// CORS setup
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // server-to-server or curl
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    console.warn('Blocked Origin:', origin);
    callback(new Error('CORS policy: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // preflight

app.use(cookieParser());

// Per-route JSON parsing (prevents raw-body mismatch)
app.use('/api/auth', express.json({ limit: '10mb' }), authRoutes);
app.use('/api/users', express.json({ limit: '10mb' }), usersRoutes);

// Optional: simple ping route to keep container warm
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(500).json({ error: err.message || 'Server error' });
});

// Connect DB once per container
connectDB().catch(console.error);

module.exports = serverless(app);

const express = require('express');
const serverless = require('serverless-http');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./lib/db');
const userRoutes = require('./routes/user.routes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Enable if you're using cookies/sessions
}));
app.use('/api/users', userRoutes);

connectDB().then(() => console.log('✅ MongoDB connected (users.js)')).catch(console.error);

app.use((err, req, res, next) => {
  console.error('User Error:', err.stack);
  res.status(500).json({ error: 'User service error' });
});

module.exports = serverless(app);

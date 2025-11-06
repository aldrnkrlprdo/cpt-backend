const express = require('express');
const serverless = require('serverless-http');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./lib/db');
const userRoutes = require('./routes/user.routes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/users', userRoutes);

connectDB().then(() => console.log('✅ MongoDB connected (users.js)')).catch(console.error);

app.use((err, req, res, next) => {
  console.error('User Error:', err.stack);
  res.status(500).json({ error: 'User service error' });
});

module.exports = serverless(app);

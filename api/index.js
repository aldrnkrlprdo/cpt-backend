const express = require('express');
const serverless = require('serverless-http');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./lib/db'); // ✅ optimized connection
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const { swaggerUi, specs } = require('./swagger');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Connect once (when container starts)
connectDB()
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection failed:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Swagger (keep separate if possible)
if (process.env.NODE_ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = serverless(app);

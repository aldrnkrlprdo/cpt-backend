const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
require('dotenv').config();

const userRoutes = require('./routes/user.routes');
const { swaggerUi, specs } = require('./swagger');

const app = express();
app.use(express.json());

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/users', userRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Safe DB connection wrapper
let isConnected = false;
const connectDB = async () => {
  if (!isConnected) {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('MongoDB connected');
  }
};

// Wrap Express with serverless
const handler = async (req, res) => {
  await connectDB(); // connect only when function is invoked
  return serverless(app)(req, res);
};

module.exports = handler;

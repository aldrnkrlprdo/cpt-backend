const express = require('express');
const serverless = require('serverless-http');
const app = express();
const userRoutes = require('./routes/user.routes');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// DB Connection
const connectDB = require('./config/db.config');
connectDB();

// Swagger
const { swaggerUi, specs } = require('./swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/users', userRoutes);

// Global error handler (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = serverless(app);
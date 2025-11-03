const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const userRoutes = require('./api/routes/user.routes');
const authRoutes = require('./api/routes/auth.routes');
const { swaggerUi, specs } = require('./api/swagger');

const app = express();
app.use(express.json());
app.use(require('cookie-parser')());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT || 3001, () => {
    console.log(`Server running on http://localhost:${process.env.PORT || 3001}`);
  });
});

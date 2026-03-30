const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./api/routes/auth.routes');
const userRoutes = require('./api/routes/user.routes');
const memberRoutes = require('./api/routes/member.routes');
const branchRoutes = require('./api/routes/branch.routes');
const loanTypeRoutes = require('./api/routes/loanType.routes');
const loans = require('./api/routes/loan.routes');
const payments = require('./api/routes/payment.routes');
const reportRoutes = require('./api/routes/report.routes');
const { swaggerUi, specs } = require('./api/swagger');

const app = express();
// CORS setup
const localOrigins = 'http://localhost:3000, http://localhost:8080';
const ALLOWED_ORIGINS = [
  ...new Set(
    `${process.env.ALLOWED_ORIGINS || ''},${localOrigins}`
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  )
];

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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api/auth', express.json({ limit: '10mb' }), authRoutes);
app.use('/api/users', express.json({ limit: '10mb' }), userRoutes);
app.use('/api/members', express.json({ limit: '10mb' }), memberRoutes);
app.use('/api/branches', express.json({ limit: '10mb' }), branchRoutes);
app.use('/api/loan-types', express.json({ limit: '10mb' }), loanTypeRoutes);
app.use('/api/loans', express.json({ limit: '10mb' }), loans);
app.use('/api/payments', express.json({ limit: '10mb' }), payments);
app.use('/api/reports', express.json({ limit: '10mb' }), reportRoutes);

app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(500).json({ error: err.message || 'Server error' });
});

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT || 3001, () => {
    console.log(`Server running on http://localhost:${process.env.PORT || 3001}`);
  });
});

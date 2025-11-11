// lib/db.js
const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const options = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // fail fast if Mongo unreachable
    };
    cached.promise = mongoose.connect(process.env.MONGODB_URI, options);
  }

  try {
    cached.conn = await cached.promise;
    console.log('✅ MongoDB connected');
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    console.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
}

module.exports = connectDB;

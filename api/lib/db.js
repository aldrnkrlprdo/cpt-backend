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
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    };

    try {
      cached.promise = mongoose.connect(process.env.MONGO_URI, options);
    } catch (err) {
      console.error('MongoDB connection error:', {
        message: err.message,
        code: err.code,
        reason: err.reason
      });
      throw err;
    }
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}

module.exports = connectDB;

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  employeeId: String,
  firstName: String,
  lastName: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  membershipStatus: { type: String, default: 'active' },
  dateOfJoining: { type: Date, default: Date.now },
  address: String,
  phoneNumber: String,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

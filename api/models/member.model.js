
const mongoose = require('mongoose');
const memberSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  membershipId: {
    type: String,
    unique: true,
    required: true,
  },
  dateOfJoining: {
    type: Date,
    default: Date.now,
  },
  membershipStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'resigned'],
    default: 'active',
  },
  address: {
    street: String,
    city: String,
    province: String,
    zipCode: String,
  },
  phoneNumber: String,
}, { timestamps: true });

module.exports = mongoose.model('Member', memberSchema);


const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
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

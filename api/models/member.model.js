
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
  employeeId: {
    type: String,
    unique: true
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
  address: String,
  phoneNumber: String,
}, { timestamps: true });

// Pre-save hook to generate employeeId
memberSchema.pre('save', async function (next) {
  if (this.isNew && !this.employeeId) {
    const Member = this.constructor;
    // Find the last member created to determine the next employeeId
    const lastMember = await Member.findOne({}, {}, { sort: { 'employeeId': -1 } });

    let nextId;
    if (lastMember && lastMember.employeeId) {
      // Increment the last employeeId
      nextId = parseInt(lastMember.employeeId, 10) + 1;
    } else {
      // This is the first member, start with a base ID (e.g., 100001)
      nextId = "000001";
    }

    this.employeeId = nextId.toString();
  }
  next();
});

module.exports = mongoose.model('Member', memberSchema);


const mongoose = require('mongoose');
const memberSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  middleName: {
    type: String,
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
  branch: {
    type: String,
  },
  dateOfJoining: {
    type: Date,
    default: Date.now,
  },
  membershipStatus: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Resigned'],
    default: 'Active',
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

    let nextIdNum;
    if (lastMember && lastMember.employeeId) {
      // Increment the last employeeId
      const lastIdNum = parseInt(lastMember.employeeId, 10);
      nextIdNum = lastIdNum + 1;
    } else {
      // This is the first member, start from 1
      nextIdNum = 1;
    }
    this.employeeId = nextIdNum.toString().padStart(6, '0');
  }
  next();
});

module.exports = mongoose.model('Member', memberSchema);

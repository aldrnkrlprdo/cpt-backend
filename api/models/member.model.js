
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
    trim: true
  },
  employeeId: {
    type: String,
    unique: true,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  dateOfJoining: {
    type: Date,
    default: Date.now,
    required: true,
  },
  membershipStatus: {
    type: String,
    enum: ['Active', 'Resigned', 'Promoted'],
    default: 'Active',
    required: true,
  },
  civilStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed'],
    default: 'Single',
    required: true,
  },
  address: String,
  phoneNumber: String,
}, { timestamps: true });

// Partial unique index for email (allows multiple null/empty emails)
memberSchema.index({ email: 1 }, {
  unique: true,
  partialFilterExpression: { email: { $type: 'string', $ne: '' } }
});

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

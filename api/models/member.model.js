
const mongoose = require('mongoose');

const normalizeEmployeeId = (employeeId) => {
  if (employeeId === undefined || employeeId === null || employeeId === '' || employeeId === '-') {
    return null;
  }

  const trimmedValue = String(employeeId).trim();
  if (!trimmedValue) {
    return null;
  }

  const numericValue = Number(trimmedValue);
  if (Number.isInteger(numericValue)) {
    return String(numericValue).padStart(6, '0');
  }

  return trimmedValue.padStart(6, '0');
};

const generateNextEmployeeId = (existingEmployeeIds = []) => {
  let highestNumericId = 0;

  for (const employeeId of existingEmployeeIds) {
    const normalizedId = normalizeEmployeeId(employeeId);
    if (!normalizedId) continue;

    const numericValue = Number(normalizedId);
    if (Number.isInteger(numericValue) && numericValue > highestNumericId) {
      highestNumericId = numericValue;
    }
  }

  return String(highestNumericId + 1).padStart(6, '0');
};

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
    const existingMembers = await Member.find(
      { employeeId: { $exists: true, $ne: null } },
      { employeeId: 1, _id: 0 }
    ).lean();

    this.employeeId = generateNextEmployeeId(existingMembers.map((member) => member.employeeId));
  }
  next();
});

const Member = mongoose.model('Member', memberSchema);
Member.generateNextEmployeeId = generateNextEmployeeId;

module.exports = Member;

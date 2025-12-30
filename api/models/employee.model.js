
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    unique: true,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  middleName: {
    type: String,
  },
  employmentDate: {
    type: Date,
    default: Date.now,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
  },
  branchHistory: [{
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch'
    },
    startDate: Date,
    endDate: Date,
  }],
  // Keeping these fields from the old member model as they are useful
  email: {
    type: String,
    unique: true,
    required: true,
  },
  membershipStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'resigned'],
    default: 'active',
  },
  phoneNumber: String,
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual property for fullName
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`;
});

// Pre-save hook to generate employeeId
employeeSchema.pre('save', async function (next) {
  if (this.isNew && !this.employeeId) {
    const Employee = this.constructor;
    const lastEmployee = await Employee.findOne({}, {}, { sort: { 'createdAt': -1 } });

    let nextId;
    if (lastEmployee && lastEmployee.employeeId) {
      const lastIdNum = parseInt(lastEmployee.employeeId.replace('EMP-', ''), 10);
      nextId = lastIdNum + 1;
    } else {
      nextId = 1001; // Start from EMP-1001
    }
    this.employeeId = `EMP-${nextId}`;
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);

const mongoose = require('mongoose');
const loanSchema = new mongoose.Schema({
  loanId: { 
    type: String,
    unique: true,
  },
  employeeId: {
    type: String,
    // ref: 'Employee', // Ref will be handled by virtual property
    required: true,
  },
  branch: {
    type: String,
    // ref: 'Branch', // Ref will be handled by virtual property
    required: true,
  },
  loanType: {
    type: String,
    // ref: 'LoanType', // Ref will be handled by virtual property
    required: true,
  },
  loanDate: {
    type: Date,
    required: true,
  },
  loanAmount: {
    type: Number,
    required: true,
  },
  maturityDate: {
    type: Date,
    required: true,
  },
  loanTerm: { // in months
    type: Number,
    required: true,
  },
  interest: { // annual interest rate
    type: Number,
    required: true,
  },
  totalPayable: {
    type: Number,
    required: true,
  },
  monthlyPayment: {
    type: Number,
    required: true,
  },
  remainingBalance: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ['Not Started', 'In Progress', 'Pending', 'Paid'],
    default: 'Not Started',
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for populating employee
loanSchema.virtual('employee', {
  ref: 'Member',
  localField: 'employeeId',
  foreignField: 'employeeId',
  justOne: true
});

// Virtual for populating branch
loanSchema.virtual('branchInfo', {
  ref: 'Branch',
  localField: 'branch',
  foreignField: 'branchId',
  justOne: true
});

// Virtual for populating loan type
loanSchema.virtual('loanTypeInfo', {
  ref: 'LoanType',
  localField: 'loanType',
  foreignField: 'loanTypeId',
  justOne: true
});

loanSchema.pre('save', async function (next) {
  if (this.isNew && !this.loanId) {
    const Loan = this.constructor;
    const lastLoan = await Loan.findOne({}, {}, { sort: { 'createdAt': -1 } });

    let nextIdNum;
    if (lastLoan && lastLoan.loanId) {
      // Ensure we handle non-numeric loanId gracefully if they ever occur
      const lastIdNum = parseInt(lastLoan.loanId, 10);
      nextIdNum = isNaN(lastIdNum) ? 1 : lastIdNum + 1;
    } else {
      nextIdNum = 1; // Start from 1
    }
    this.loanId = nextIdNum.toString().padStart(6, '0');
  }
  next();
});

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
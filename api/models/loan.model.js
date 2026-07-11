const mongoose = require('mongoose');

const normalizeLoanId = (loanId) => {
  if (loanId === undefined || loanId === null || loanId === '' || loanId === '-') {
    return null;
  }

  const trimmedValue = String(loanId).trim();
  if (!trimmedValue) {
    return null;
  }

  const numericValue = Number(trimmedValue);
  if (Number.isInteger(numericValue)) {
    return String(numericValue).padStart(6, '0');
  }

  return trimmedValue.padStart(6, '0');
};

const generateNextLoanId = (existingLoanIds = []) => {
  let highestNumericId = 0;

  for (const loanId of existingLoanIds) {
    const normalizedId = normalizeLoanId(loanId);
    if (!normalizedId) continue;

    const numericValue = Number(normalizedId);
    if (Number.isInteger(numericValue) && numericValue > highestNumericId) {
      highestNumericId = numericValue;
    }
  }

  return String(highestNumericId + 1).padStart(6, '0');
};

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
    const existingLoans = await Loan.find(
      { loanId: { $exists: true, $ne: null } },
      { loanId: 1, _id: 0 }
    ).lean();

    this.loanId = generateNextLoanId(existingLoans.map((loan) => loan.loanId));
  }
  next();
});

const Loan = mongoose.model('Loan', loanSchema);
Loan.generateNextLoanId = generateNextLoanId;

module.exports = Loan;
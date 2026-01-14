
const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loanId: { 
    type: String,
    unique: true,
  },
  employeeId: {
    type: String,
    ref: 'Employee',
    required: true,
  },
  branch: {
    type: String,
    ref: 'Branch',
    required: true,
  },
  loanType: {
    type: String,
    ref: 'LoanType',
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
    // required: true,
  },
  monthlyPayment: {
    type: Number,
    // required: true,
  },
}, { timestamps: true });

loanSchema.pre('save', async function (next) {
  if (this.isNew && !this.loanId) {
    const Loan = this.constructor;
    const lastLoan = await Loan.findOne({}, {}, { sort: { 'createdAt': -1 } });

    let nextId;
    if (lastLoan && lastLoan.loanId) {
      const lastIdNum = parseInt(lastLoan.loanId, 10);
      nextId = lastIdNum + 1;
    } else {
      nextId = '000001'; // Start from LOAN-100001
    }
    this.loanId = nextId;
  }
  next();
});

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;

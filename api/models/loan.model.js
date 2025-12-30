
const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loanId: { 
    type: String,
    unique: true,
    required: true,
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  loanType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanType',
    required: true,
  },
  loanDate: {
    type: Date,
    default: Date.now,
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
}, { timestamps: true });

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;

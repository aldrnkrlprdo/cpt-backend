
const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loanId: { 
    type: String,
    unique: true,
    required: true,
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

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;

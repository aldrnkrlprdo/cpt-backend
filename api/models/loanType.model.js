
const mongoose = require('mongoose');

const loanTypeSchema = new mongoose.Schema({
  loanTypeCode: {
    type: String,
    required: true,
    unique: true,
  },
  loanTypeName: {
    type: String,
    required: true,
    unique: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('LoanType', loanTypeSchema);

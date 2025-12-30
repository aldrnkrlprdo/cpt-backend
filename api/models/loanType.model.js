
const mongoose = require('mongoose');

const loanTypeSchema = new mongoose.Schema({
  loanTypeId: {
    type: String,
    unique: true,
  },
  loanTypeName: {
    type: String,
    required: true,
    unique: true,
  },
}, { timestamps: true });

// Pre-save hook to generate loanTypeId
loanTypeSchema.pre('save', async function (next) {
  if (this.isNew && !this.loanTypeId) {
    const LoanType = this.constructor;
    const lastLoanType = await LoanType.findOne({}, {}, { sort: { 'createdAt': -1 } });

    let nextId;
    if (lastLoanType && lastLoanType.loanTypeId) {
      const lastIdNum = parseInt(lastLoanType.loanTypeId.replace('LT-', ''), 10);
      nextId = lastIdNum + 1;
    } else {
      nextId = 101; // Start from LT-101
    }
    this.loanTypeId = `LT-${nextId}`;
  }
  next();
});

module.exports = mongoose.model('LoanType', loanTypeSchema);

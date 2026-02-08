
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    unique: true,
    required: true,
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  loanId: {
    type: String,
    ref: 'Loan'
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

paymentSchema.pre('save', async function (next) {
  if (this.isNew && !this.paymentId) {
    const Payment = this.constructor;
    const lastPayment = await Payment.findOne({}, {}, { sort: { 'createdAt': -1 } });

    let nextIdNum;
    if (lastPayment && lastPayment.paymentId) {
      const lastIdNum = parseInt(lastPayment.paymentId, 10);
      nextIdNum = lastIdNum + 1;
    } else {
      nextIdNum = '000001'; // Start from 1
    }
    this.paymentId = nextIdNum;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

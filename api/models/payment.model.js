
const mongoose = require('mongoose');

const normalizePaymentId = (paymentId) => {
  if (paymentId === undefined || paymentId === null || paymentId === '' || paymentId === '-') {
    return null;
  }

  const trimmedValue = String(paymentId).trim();
  if (!trimmedValue) {
    return null;
  }

  const numericValue = Number(trimmedValue);
  if (Number.isInteger(numericValue)) {
    return String(numericValue).padStart(6, '0');
  }

  return trimmedValue.padStart(6, '0');
};

const generateNextPaymentId = (existingPaymentIds = []) => {
  let highestNumericId = 0;

  for (const paymentId of existingPaymentIds) {
    const normalizedId = normalizePaymentId(paymentId);
    if (!normalizedId) continue;

    const numericValue = Number(normalizedId);
    if (Number.isInteger(numericValue) && numericValue > highestNumericId) {
      highestNumericId = numericValue;
    }
  }

  return String(highestNumericId + 1).padStart(6, '0');
};

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    unique: true,
  },
  employeeId: {
    type: String,
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
  paymentType: {
    type: String,
    default: 'Contribution',
  },
  notes: {
    type: String,
    default: '',
  },
  isFullPayment: {
    type: Boolean,
    default: false,
  },
  interestRebate: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

paymentSchema.virtual('member', {
  ref: 'Member',
  localField: 'employeeId',
  foreignField: 'employeeId',
  justOne: true
});

paymentSchema.virtual('employee', {
  ref: 'Member',
  localField: 'employeeId',
  foreignField: 'employeeId',
  justOne: true
});

paymentSchema.virtual('loan', {
  ref: 'Loan',
  localField: 'loanId',
  foreignField: 'loanId',
  justOne: true
});

paymentSchema.pre('save', async function (next) {
  if (this.isNew && !this.paymentId) {
    const Payment = this.constructor;
    const existingPayments = await Payment.find(
      { paymentId: { $exists: true, $ne: null } },
      { paymentId: 1, _id: 0 }
    ).lean();

    this.paymentId = generateNextPaymentId(existingPayments.map((payment) => payment.paymentId));
  }

  next();
});

const Payment = mongoose.model('Payment', paymentSchema);
Payment.generateNextPaymentId = generateNextPaymentId;

module.exports = Payment;

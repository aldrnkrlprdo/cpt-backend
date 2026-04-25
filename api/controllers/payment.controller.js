
const Payment = require('../models/payment.model');
const Loan = require('../models/loan.model');
const connectDB = require('../lib/db');

// Create a new payment
exports.createPayment = async (req, res) => {
  try {
    await connectDB();
    const { loanId, amountPaid, interestRebate, isFullPayment } = req.body;

    const newPayment = new Payment(req.body);
    await newPayment.save();

    if (loanId) {
      const loan = await Loan.findOne({ loanId: loanId });
      if (loan) {
        // Calculate new remaining balance
        const newRemainingBalance = loan.remainingBalance - amountPaid - (interestRebate || 0);

        // Determine the new status
        const newStatus = isFullPayment ? 'Paid' : 'In Progress';

        // Update the loan
        await Loan.findOneAndUpdate(
          { loanId: loanId },
          {
            $set: {
              status: newStatus,
              remainingBalance: newRemainingBalance < 0 ? 0 : newRemainingBalance
            }
          },
          { new: true }
        );
      }
    }

    res.status(201).json({ message: 'Payment created successfully', payment: newPayment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all payments with filtering
exports.getAllPayments = async (req, res) => {
  try {
    await connectDB();
    const { employeeId, loanId } = req.query;
    const filter = {};

    if (employeeId) filter.employee = employeeId;
    if (loanId) filter.loan = loanId;

    const payments = await Payment.find(filter).populate('employee').populate('loan');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const payment = await Payment.findOne(id).populate('employee').populate('loan');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a payment
exports.updatePayment = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const updateData = req.body;

    // Find the original payment before the update
    const originalPayment = await Payment.findOne({ paymentId: id });
    if (!originalPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update the payment document
    const updatedPayment = await Payment.findOneAndUpdate({ paymentId: id }, updateData, { new: true, runValidators: true });

    // If the payment is associated with a loan, update the loan's balance and status
    if (updatedPayment.loanId) {
      const loan = await Loan.findOne({ loanId: updatedPayment.loanId });
      if (loan) {
        // Revert the original payment's effect
        const balanceAfterReverting = loan.remainingBalance + originalPayment.amountPaid + (originalPayment.interestRebate || 0);
        
        // Apply the updated payment's effect
        const newRemainingBalance = balanceAfterReverting - updatedPayment.amountPaid - (updatedPayment.interestRebate || 0);
        
        // Determine the new status
        const newStatus = updatedPayment.isFullPayment ? 'Paid' : 'In Progress';

        // Update the loan
        await Loan.findOneAndUpdate(
          { loanId: updatedPayment.loanId },
          {
            $set: {
              status: newStatus,
              remainingBalance: newRemainingBalance < 0 ? 0 : newRemainingBalance
            }
          },
          { new: true }
        );
      }
    }

    res.json({ message: 'Payment updated successfully', payment: updatedPayment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a payment
exports.deletePayment = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const deletedPayment = await Payment.findOneAndDelete({ paymentId: id });
    if (!deletedPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const loan = await Loan.findOne({ loanId: deletedPayment.loanId });
    if (loan) {
      const newRemainingBalance = loan.remainingBalance + deletedPayment.amountPaid;
      const newStatus = newRemainingBalance > 0 ? 'In Progress' : 'Paid';

      await Loan.findOneAndUpdate(
        { loanId: deletedPayment.loanId },
        { 
          $set: { 
            remainingBalance: newRemainingBalance > loan.totalPayable ? loan.totalPayable : newRemainingBalance,
            status: newStatus 
          }
        }
      );
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all payments for a specific employee
exports.getAllPaymentsByEmployeeId = async (req, res) => {
  try {
    await connectDB();
    const { employeeId } = req.params;

    const payments = await Payment.find({ employeeId: employeeId })

    if (!payments || payments.length === 0) {
      return res.json([]);
    }

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

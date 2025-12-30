
const Payment = require('../models/payment.model');
const connectDB = require('../lib/db');

// Create a new payment
exports.createPayment = async (req, res) => {
  try {
    await connectDB();
    const newPayment = new Payment(req.body);
    await newPayment.save();
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
    const payment = await Payment.findById(id).populate('employee').populate('loan');
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
    const updatedPayment = await Payment.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updatedPayment) return res.status(404).json({ error: 'Payment not found' });
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
    const deletedPayment = await Payment.findByIdAndDelete(id);
    if (!deletedPayment) return res.status(404).json({ error: 'Payment not found' });
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

    const payments = await Payment.find({ employee: employeeId }).populate('employee').populate('loan');
    
    if (!payments) {
      return res.status(404).json({ error: 'No payments found for this employee' });
    }

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

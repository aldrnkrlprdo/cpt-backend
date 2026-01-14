
const Loan = require('../models/loan.model');
const connectDB = require('../lib/db');
const mongoose = require('mongoose');
const Member = require('../models/member.model'); // Ensure Employee model is registered
require('../models/branch.model'); // Ensure Branch model is registered
require('../models/loanType.model'); // Ensure LoanType model is registered

// Create a new loan
exports.createLoan = async (req, res) => {
  try {
    await connectDB();
    const newLoan = new Loan(req.body);
    await newLoan.save();
    res.status(201).json({ message: 'Loan created successfully', loan: newLoan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all loans with filtering
exports.getAllLoans = async (req, res) => {
  try {
    await connectDB();
    const { employeeId, branch, loanType } = req.query;
    const filter = {};

    if (employeeId) {
      // Find employee by the string ID to get the ObjectId
      const employee = await Employee.findOne({ employeeId: employeeId });
      if (employee) {
        filter.employeeId = employee._id;
      } else {
        // If no employee found, no loans will match.
        return res.json([]);
      }
    }
    if (branch) filter.branch = branch;
    if (loanType) filter.loanType = loanType;

    const loans = await Loan.find(filter)
      .populate('employeeId')
      .populate('branch')
      .populate('loanType');
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single loan by ID
exports.getLoanById = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const loan = await Loan.findById(id)
      .populate('employeeId')
      .populate('branch')
      .populate('loanType');
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a loan
exports.updateLoan = async (req, res) => {
  try {
    await connectDB();
    const { loanId } = req.params;
    console.log("loanId: ", loanId)
    const updatedLoan = await Loan.findOneAndUpdate({ loanId: loanId }, req.body, { new: true, runValidators: true });
    if (!updatedLoan) return res.status(404).json({ error: 'Loan not found' });
    res.json({ message: 'Loan updated successfully', loan: updatedLoan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a loan
exports.deleteLoan = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const deletedLoan = await Loan.findByIdAndDelete(id);
    if (!deletedLoan) return res.status(404).json({ error: 'Loan not found' });
    res.json({ message: 'Loan deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all loans for a specific employee
exports.getAllLoansByEmployeeId = async (req, res) => {
  try {
    await connectDB();
    const { employeeId } = req.params;

    // Use the employee's Id to find their loans
    const loans = await Loan.find({ employeeId: employeeId })

    if (!loans || loans.length === 0) {
      // It's better to return an empty array than a 404 if the employee exists but has no loans.
      return res.json([]);
    }

    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
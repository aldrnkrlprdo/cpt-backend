
const LoanType = require('../models/loanType.model');
const connectDB = require('../lib/db');
const mongoose = require('mongoose');

// Create a new loan type
exports.createLoanType = async (req, res) => {
  try {
    await connectDB();
    const { loanTypeCode, loanTypeName } = req.body;

    if (!loanTypeCode) {
      return res.status(400).json({ error: 'Loan type code is required.' });
    }

    if (!loanTypeName) {
      return res.status(400).json({ error: 'Loan type name is required.' });
    }

    const existingLoanType = await LoanType.findOne({ loanTypeName });
    if (existingLoanType) {
      return res.status(400).json({ error: 'Loan type with this name already exists.' });
    }

    const newLoanType = new LoanType({ loanTypeName });
    await newLoanType.save();

    res.status(201).json({ message: 'Loan type created successfully', loanType: newLoanType });
  } catch (err) {
    console.error('CreateLoanType error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get all loan types
exports.getAllLoanTypes = async (req, res) => {
  try {
    await connectDB();
    const loanTypes = await LoanType.find({});
    res.json(loanTypes);
  } catch (err) {
    console.error('GetAllLoanTypes error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get a single loan type by ID or loanTypeCode
exports.getLoanTypeById = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { loanTypeCode: id };

    const loanType = await LoanType.findOne(query);

    if (!loanType) {
      return res.status(404).json({ error: 'Loan type not found' });
    }
    res.json(loanType);
  } catch (err) {
    console.error('GetLoanTypeById error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update a loan type
exports.updateLoanType = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { loanTypeName } = req.body;

    if (!loanTypeName) {
      return res.status(400).json({ error: 'Loan type name is required.' });
    }

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { loanTypeCode: id };

    const updatedLoanType = await LoanType.findOneAndUpdate(query, { loanTypeName }, {
      new: true,
      runValidators: true,
    });

    if (!updatedLoanType) {
      return res.status(404).json({ error: 'Loan type not found' });
    }
    res.json({ message: 'Loan type updated successfully', loanType: updatedLoanType });
  } catch (err) {
    console.error('UpdateLoanType error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Loan type name already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
};

// Delete a loan type
exports.deleteLoanType = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { loanTypeCode: id };

    const deletedLoanType = await LoanType.findOneAndDelete(query);

    if (!deletedLoanType) {
      return res.status(404).json({ error: 'Loan type not found' });
    }
    res.json({ message: 'Loan type deleted successfully' });
  } catch (err) {
    console.error('DeleteLoanType error:', err);
    res.status(500).json({ error: err.message });
  }
};

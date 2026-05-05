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
    const { employeeId } = req.body;

    // Find the last active loan for the employee and update its status to 'Pending'
    if (employeeId) {
      const lastActiveLoan = await Loan.findOne({
        employeeId: employeeId,
        status: 'In Progress'
      }).sort({ createdAt: -1 });

      if (lastActiveLoan) {
        lastActiveLoan.status = 'Pending';
        await lastActiveLoan.save();
      }
    }

    // Create a mutable copy of the request body to modify
    const loanData = { ...req.body };

    // Set remainingBalance to totalPayable on creation
    loanData.remainingBalance = loanData.totalPayable;

    // Create and save the new loan using the modified data
    const newLoan = new Loan(loanData);
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
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { loanId: id };

    const updatedLoan = await Loan.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
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
    const deletedLoan = await Loan.findOneAndDelete({ loanId: id });
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

// Bulk upload loans
exports.bulkUploadLoans = async (req, res) => {
  try {
    await connectDB();
    const { loans } = req.body;

    if (!Array.isArray(loans) || loans.length === 0) {
      return res.status(400).json({ error: 'Invalid request: loans array is required' });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const [index, loanData ]of loans.entries()) {
      try {
        const { employeeId, branch, loanType, loanAmount, interest, loanTerm, loanDate, maturityDate, status, loanId  } = loanData;

         if (!employeeId || !branch || !loanType || !loanAmount || !interest || !loanTerm || !loanDate) {
          results.failed.push({
            loan: loanData,
            error: {
              row: index + 1,
              employeeId: employeeId || '',
              loanId: loanId || '',
              message: 'Missing required fields'
            }
          });
          continue;
        }

        // Check if loanId is provided and not empty, validate uniqueness
        if (loanId && loanId.trim() !== '') {
          const existingLoan = await Loan.findOne({ loanId: loanId.trim() });
          if (existingLoan) {
            results.failed.push({
            loan: loanData,
              error: {
                row: index + 1,
                employeeId: employeeId,
                loanId: loanId,
                message: `Loan ID ${loanId} already exists`
              }
          });
          continue;
          }
        }

        // Use provided maturityDate if present, otherwise calculate
        let maturity;
        if (maturityDate) {
          maturity = new Date(maturityDate);
        } else {
          const startDate = new Date(loanDate);
          maturity = new Date(startDate);
          maturity.setMonth(maturity.getMonth() + parseInt(loanTerm));
        }

        // Calculate total payable and monthly payment
        const principal = parseFloat(loanAmount);
        const rate = parseFloat(interest) / 100; // monthly rate
        const term = parseInt(loanTerm);

        // Calculate total interest
        const totalInterest = principal * rate * term;

        // Calculate total payable
        const totalPayable = principal + totalInterest;

        // Calculate monthly payment
        const monthlyPayment = totalPayable / term;

        const newLoan = new Loan({
          employeeId,
          branch,
          loanType,
          loanAmount: principal,
          interest,
          loanTerm: term,
          loanDate: new Date(loanDate),
          maturityDate: maturity,
          totalPayable: Math.round(totalPayable * 100) / 100,
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          remainingBalance: Math.round(totalPayable * 100) / 100,
          status: status || 'In Progress'
        });

        // Override loanId if provided and not empty
        if (loanId && loanId.trim() !== '') {
          newLoan.loanId = loanId.trim().toString().padStart(6, '0');
        }

        await newLoan.save();
        results.success.push(newLoan);
      } catch (innerError) {
        results.failed.push({
          loan: loanData,
          error: {
            row: index + 1,
            employeeId: loanData.employeeId || '',
            loanId: loanData.loanId || '',
            message: innerError.message
          }
        });
      }
    }

    res.status(201).json({
      message: `Bulk upload completed: ${results.success.length} succeeded, ${results.failed.length} failed`,
      successCount: results.success.length,
      failedCount: results.failed.length,
      failed: results.failed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
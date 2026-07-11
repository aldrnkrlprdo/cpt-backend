
const Payment = require('../models/payment.model');
const Loan = require('../models/loan.model');
const Member = require('../models/member.model');
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

// Bulk upload payments - optimized for large datasets (5K+ rows)
exports.bulkUploadPayments = async (req, res) => {
  try {
    await connectDB();
    const { payments } = req.body;

    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ error: 'Invalid request: payments array is required' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    const existingPaymentIds = await Payment.find(
      { paymentId: { $exists: true, $ne: null } },
      { paymentId: 1, _id: 0 }
    ).lean();
    const usedPaymentIds = new Set(existingPaymentIds.map((payment) => payment.paymentId).filter(Boolean));
    const assignedPaymentIds = new Set();
    let nextGeneratedPaymentId = Payment.generateNextPaymentId([...usedPaymentIds]);

    // Pre-fetch all unique employeeIds
    const uniqueEmployeeIds = [...new Set(payments.map(p => p.employeeId).filter(Boolean))];

    // Bulk fetch all employees
    const employees = await Member.find({ employeeId: { $in: uniqueEmployeeIds } }).lean();
    const employeeMap = new Map(employees.map(e => [e.employeeId, e]));

    // Bulk fetch all loans for non-contribution payments
    const nonContributionPayments = payments.filter(p => p.paymentType !== 'Contribution');
    const loanQueries = nonContributionPayments.map(p => ({
      employeeId: p.employeeId,
      loanType: p.paymentType
    }));
    
    const loans = await Loan.find({ $or: loanQueries }).lean();
    const loanMap = new Map(loans.map(l => [`${l.employeeId}-${l.loanType}`, l]));

    const batchPayments = [];
    const loanUpdates = new Map();

    // Process all payments
    for (let i = 0; i < payments.length; i++) {
      const paymentData = payments[i];
      const { employeeId, paymentType, amountPaid, paymentDate, paymentId, isFullPayment, interestRebate } = paymentData;
      const isContribution = paymentType === 'Contribution';

      // Validate required fields
      if (!employeeId || !paymentType || !amountPaid || !paymentDate) {
        results.errors.push({
          row: i + 1,
          employeeId,
          paymentType,
          message: 'Missing required fields'
        });
        results.failed++;
        continue;
      }

      // Check if employee exists
      const employee = employeeMap.get(employeeId);
      if (!employee) {
        results.errors.push({
          row: i + 1,
          employeeId,
          paymentId,
          paymentType,
          amountPaid,
          message: 'Employee not found'
        });
        results.failed++;
        continue;
      }

      // Get loan data if not a contribution
      let loan = null;
      if (!isContribution) {
        loan = loanMap.get(`${employeeId}-${paymentType}`);

        if (!loan) {
          results.errors.push({
            row: i + 1,
            employeeId,
            paymentId,
            paymentType,
            amountPaid,
            message: 'Loan not found for this employee and payment type'
          });
          results.failed++;
          continue;
        }
      }

      const hasExplicitPaymentId = paymentId !== undefined && paymentId !== null && paymentId !== '-' && paymentId !== '';
      const normalizedPaymentId = hasExplicitPaymentId
        ? String(paymentId).trim().padStart(6, '0')
        : nextGeneratedPaymentId;

      if (assignedPaymentIds.has(normalizedPaymentId) || usedPaymentIds.has(normalizedPaymentId)) {
        results.errors.push({
          row: i + 1,
          employeeId,
          paymentId: normalizedPaymentId,
          paymentType,
          amountPaid,
          message: 'Duplicate paymentId in upload batch'
        });
        results.failed++;
        continue;
      }
      assignedPaymentIds.add(normalizedPaymentId);
      usedPaymentIds.add(normalizedPaymentId);

      if (!hasExplicitPaymentId) {
        nextGeneratedPaymentId = Payment.generateNextPaymentId([...usedPaymentIds]);
      }

      // Prepare payment document
      batchPayments.push({
        paymentId: normalizedPaymentId,
        employeeId,
        loanId: loan ? loan.loanId : null,
        paymentType,
        amountPaid: parseFloat(amountPaid),
        interestRebate: interestRebate ? parseFloat(interestRebate) : 0,
        paymentDate: new Date(paymentDate),
        isFullPayment: isFullPayment || false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Track loan balance updates
      if (!isContribution && loan) {
        const currentUpdate = loanUpdates.get(loan.loanId) || { 
          amount: 0, 
          rebate: 0,
          hasFullPayment: false,
          originalBalance: loan.remainingBalance
        };
        currentUpdate.amount += parseFloat(amountPaid);
        currentUpdate.rebate += interestRebate ? parseFloat(interestRebate) : 0;
        currentUpdate.hasFullPayment = currentUpdate.hasFullPayment || (isFullPayment || false);
        loanUpdates.set(loan.loanId, currentUpdate);
      }
    }

    // Bulk insert payments
    if (batchPayments.length > 0) {
      try {
        await Payment.insertMany(batchPayments, { ordered: false });
        results.success += batchPayments.length;
      } catch (insertError) {
        console.error('Bulk insert error:', insertError.message);
        // Handle partial success
        const insertedCount = insertError.result?.nInserted || 0;
        results.success += insertedCount;
        results.failed += batchPayments.length - insertedCount;
      }
    }

    // Bulk update loans
    if (loanUpdates.size > 0) {
      const bulkOps = [];
      for (const [loanId, update] of loanUpdates) {
        const totalPaymentAmount = update.amount + update.rebate;
        const newBalance = update.originalBalance - totalPaymentAmount;
        const newStatus = update.hasFullPayment || newBalance <= 0 ? 'Paid' : 'In Progress';

        bulkOps.push({
          updateOne: {
            filter: { loanId },
            update: {
              $set: {
                remainingBalance: newBalance < 0 ? 0 : newBalance,
                status: newStatus,
                updatedAt: new Date()
              }
            }
          }
        });
      }

      if (bulkOps.length > 0) {
        try {
          await Loan.bulkWrite(bulkOps);
        } catch (updateError) {
          console.error('Bulk update error:', updateError.message);
        }
      }
    }

    res.status(201).json(results);
  } catch (err) {
    console.error('BulkUploadPayments error:', err);
    res.status(500).json({ error: err.message });
  }
};
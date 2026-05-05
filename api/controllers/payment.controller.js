
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
// Bulk upload payments - optimized for large datasets (5K+ rows)
exports.bulkUploadPayments = async (req, res) => {
  const BATCH_SIZE = 500; // Process in batches of 500

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

    // Fetch the last payment document
    const lastPayment = await Payment.findOne({}, {}, { sort: { paymentId: -1 } });
    let lastPaymentIdNum = lastPayment ? parseInt(lastPayment.paymentId, 10) : 0;

    // Pre-fetch all unique employeeIds
    const uniqueEmployeeIds = [...new Set(payments.map(p => p.employeeId).filter(Boolean))];

    // Bulk fetch all employees
    const employees = await Member.find({ employeeId: { $in: uniqueEmployeeIds } }).lean();
    const employeeMap = new Map(employees.map(e => [e.employeeId, e]));

    // Process in batches
    for (let i = 0; i < payments.length; i += BATCH_SIZE) {
      const batch = payments.slice(i, i + BATCH_SIZE);
      const batchPayments = [];
      const batchLoanUpdates = new Map();

      // Validate and prepare batch
      for (const paymentData of batch) {
        const { employeeId, paymentType, amountPaid, paymentDate, paymentId, isFullPayment, interestRebate } = paymentData;
        const isContribution = paymentType === 'Contribution';

        // Validate required fields
        if (!employeeId || !paymentType || !amountPaid || !paymentDate) {
          results.errors.push({
            row: i + batch.indexOf(paymentData) + 1,
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
            row: i + batch.indexOf(paymentData) + 1,
            employeeId,
            paymentId,
            paymentType,
            amountPaid,
            message: 'Employee not found'
          });
          results.failed++;
          continue;
        }

        // Fetch the loan data if not a contribution
        let loan = null;
        if (!isContribution) {
          loan = await Loan.findOne({ employeeId, loanType: paymentType });

          if (!loan) {
            results.errors.push({
              row: i + batch.indexOf(paymentData) + 1,
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

        // Generate paymentId
        lastPaymentIdNum++;
        const newPaymentId = lastPaymentIdNum.toString().padStart(6, '0');

        // Prepare payment document
        batchPayments.push({
          paymentId: paymentId ? paymentId.toString().padStart(6, '0') : newPaymentId,
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
          const currentUpdate = batchLoanUpdates.get(loan.loanId) || { 
            amount: 0, 
            rebate: 0,
            count: 0, 
            hasFullPayment: false 
          };
          currentUpdate.amount += parseFloat(amountPaid);
          currentUpdate.rebate += interestRebate ? parseFloat(interestRebate) : 0;
          currentUpdate.count += 1;
          currentUpdate.hasFullPayment = currentUpdate.hasFullPayment || (isFullPayment || false);
          batchLoanUpdates.set(loan.loanId, currentUpdate);
        }
      }

      // Bulk insert payments
      if (batchPayments.length > 0) {
        try {
          await Payment.insertMany(batchPayments, { ordered: false });
          results.success += batchPayments.length;
        } catch (insertError) {
          console.error('Bulk insert error:', insertError.message);
          results.failed += batchPayments.length;
        }
      }

      // Bulk update loans
      if (batchLoanUpdates.size > 0) {
        const bulkOps = [];
        for (const [loanId, update] of batchLoanUpdates) {
          const originalLoan = await Loan.findOne({ loanId });

          if (originalLoan) {
            const totalPaymentAmount = update.amount + update.rebate;
            const newBalance = originalLoan.remainingBalance - totalPaymentAmount;
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
        }

        if (bulkOps.length > 0) {
          try {
            await Loan.bulkWrite(bulkOps);
          } catch (updateError) {
            console.error('Bulk update error:', updateError.message);
          }
        }
      }
    }

    res.status(201).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
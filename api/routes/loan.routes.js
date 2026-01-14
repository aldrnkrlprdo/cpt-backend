
const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loan.controller');

/**
 * @swagger
 * tags:
 *   name: Loans
 *   description: Loan management
 */

/**
 * @swagger
 * /api/loans:
 *   post:
 *     summary: Create a new loan
 *     tags: [Loans]
 *     responses:
 *       201:
 *         description: Loan created
 *   get:
 *     summary: Get all loans
 *     tags: [Loans]
 *     responses:
 *       200:
 *         description: A list of loans
 */
router.route('/')
  .post(loanController.createLoan)
  .get(loanController.getAllLoans);

/**
 * @swagger
 * /api/loans/employee/{employeeId}:
 *   get:
 *     summary: Get all loans for a specific employee
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         schema:
 *           type: string
 *         required: true
 *         description: The employee ID
 *     responses:
 *       200:
 *         description: A list of loans for the specified employee
 *       404:
 *         description: No loans found for this employee
 */
router.route('/employee/:employeeId').get(loanController.getAllLoansByEmployeeId);

/**
 * @swagger
 * /api/loans/{id}:
 *   get:
 *     summary: Get a loan by ID
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Loan data
 *   patch:
 *     summary: Update a loan by ID
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Loan updated
 *   delete:
 *     summary: Delete a loan by ID
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Loan deleted
 */
router.route('/:id')
  .get(loanController.getLoanById)
  .put(loanController.updateLoan)
  .delete(loanController.deleteLoan);

module.exports = router;

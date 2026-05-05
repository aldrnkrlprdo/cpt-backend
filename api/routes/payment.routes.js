
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management
 */

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
 *     responses:
 *       201:
 *         description: Payment created
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: A list of payments
 */
router.route('/')
  .post(paymentController.createPayment)
  .get(paymentController.getAllPayments);

/**
 * @swagger
 * /api/payments/employee/{employeeId}:
 *   get:
 *     summary: Get all payments for a specific employee
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of payments for the employee
 */
router.get('/employee/:employeeId', paymentController.getAllPaymentsByEmployeeId);
router.post('/bulk-upload', paymentController.bulkUploadPayments);
/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get a payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment data
 *   patch:
 *     summary: Update a payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment updated
 *   delete:
 *     summary: Delete a payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment deleted
 */
router.route('/:id')
  .get(paymentController.getPaymentById)
  .post(paymentController.updatePayment)
  .delete(paymentController.deletePayment);

module.exports = router;

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// All routes in this file are protected and require admin role
router.use(auth, role('admin'));

router.get('/loans', reportController.generateLoanReport);
router.get('/members', reportController.generateMemberReport);
router.get('/payments', reportController.generatePaymentReport);
router.get('/capital', reportController.generateCapitalReport);

module.exports = router;

const express = require('express');
const router = express.Router();
const loanTypeController = require('../controllers/loanType.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// All routes are protected
router.use(auth);

router.route('/')
    .post(role('admin'), loanTypeController.createLoanType)
    .get(loanTypeController.getAllLoanTypes);

router.route('/:id')
    .get(loanTypeController.getLoanTypeById)
    .put(role('admin'), loanTypeController.updateLoanType)
    .delete(role('admin'), loanTypeController.deleteLoanType);

module.exports = router;

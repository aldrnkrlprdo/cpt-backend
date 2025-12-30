
const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branch.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Routes for Branch
// All routes are protected
router.use(auth);

router.post('/', role('admin'), branchController.createBranch);
router.get('/', branchController.getAllBranches);
router.get('/:id', branchController.getBranchById);
router.put('/:id', role('admin'), branchController.updateBranch);
router.delete('/:id', role('admin'), branchController.deleteBranch);

module.exports = router;

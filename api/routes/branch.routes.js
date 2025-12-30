
const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branch.controller');
const { isAuthenticated, isAuthorized } = require('../middlewares/auth.middleware');

// Routes for Branch
// All routes are protected and require admin access
router.post('/', isAuthenticated, isAuthorized('admin'), branchController.createBranch);
router.get('/', isAuthenticated, branchController.getAllBranches);
router.get('/:id', isAuthenticated, branchController.getBranchById);
router.put('/:id', isAuthenticated, isAuthorized('admin'), branchController.updateBranch);
router.delete('/:id', isAuthenticated, isAuthorized('admin'), branchController.deleteBranch);

module.exports = router;

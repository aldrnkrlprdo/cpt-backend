const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const express = require('express');
const branchController = require('../controllers/branch.controller');
const router = express.Router();

// Routes for Branch
// All routes are protected
router.use(auth);

// Bulk upload routes - must be defined before /:id route
router.post('/bulk', role('admin'), branchController.bulkUploadBranches);

router.post('/', role('admin'), branchController.createBranch);
router.get('/', branchController.getAllBranches);
router.get('/:id', branchController.getBranchById);
router.put('/:id', role('admin'), branchController.updateBranch);
router.delete('/:id', role('admin'), branchController.deleteBranch);

module.exports = router;

const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// All routes in this file are protected and require admin role
router.use(auth);

router.route('/')
  .get(memberController.getAllMembers)
  .post(memberController.createMember);

// Bulk upload routes - must be defined before /:id route
router.post('/bulk/validate', memberController.validateBulkUpload);
router.post('/bulk', memberController.bulkUploadMembers);

router.route('/:id')
  .get(memberController.getMemberById)
  .put(memberController.updateMember)
  .delete(memberController.deleteMember);

module.exports = router;

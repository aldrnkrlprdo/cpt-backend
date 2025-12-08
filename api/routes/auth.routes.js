const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.route('/me')
  .get(auth, authController.me)
  .put(auth, authController.updateProfile);

module.exports = router;

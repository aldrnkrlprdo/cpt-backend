const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');

console.log(typeof userController.getAllUsers); // should log 'function'
console.log(typeof auth); // should log 'function'

router.get('/', auth, userController.getAllUsers);
router.post('/', auth, userController.createUser);

module.exports = router;

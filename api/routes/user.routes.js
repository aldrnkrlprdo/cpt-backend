const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');
const restrictTo = require('../middlewares/role.middleware');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', auth, restrictTo(['admin']), userController.getAllUsers);
router.get('/:id', auth, userController.getUserById);
router.post('/', auth, userController.createUser);
router.put('/:id', auth, userController.updateUser);
router.delete('/:id', auth, restrictTo(['admin']), userController.deleteUser);

module.exports = router;

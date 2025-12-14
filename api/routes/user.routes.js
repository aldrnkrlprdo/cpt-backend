const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// All routes in this file are protected and require admin role
router.use(auth, role('admin'));
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve a list of users
 *     description: Returns all users from the database. Requires admin privileges.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
router.route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser)
router.route('/:id')
    .put(userController.updateUser)
    .delete(userController.deleteUser)

module.exports = router;

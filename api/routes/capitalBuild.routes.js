
const express = require('express');
const router = express.Router();
const capitalBuildController = require('../controllers/capitalBuild.controller');

/**
 * @swagger
 * tags:
 *   name: CapitalBuild
 *   description: Capital Build-Up management
 */

/**
 * @swagger
 * /api/capital-builds:
 *   post:
 *     summary: Create a new contribution
 *     tags: [CapitalBuild]
 *     responses:
 *       201:
 *         description: Contribution created
 *   get:
 *     summary: Get all contributions
 *     tags: [CapitalBuild]
 *     responses:
 *       200:
 *         description: A list of contributions
 */
router.route('/')
  .post(capitalBuildController.createContribution)
  .get(capitalBuildController.getAllContributions);

/**
 * @swagger
 * /api/capital-builds/{id}:
 *   get:
 *     summary: Get a contribution by ID
 *     tags: [CapitalBuild]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contribution data
 *   patch:
 *     summary: Update a contribution by ID
 *     tags: [CapitalBuild]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contribution updated
 *   delete:
 *     summary: Delete a contribution by ID
 *     tags: [CapitalBuild]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contribution deleted
 */
router.route('/:id')
  .get(capitalBuildController.getContributionById)
  .patch(capitalBuildController.updateContribution)
  .delete(capitalBuildController.deleteContribution);

module.exports = router;

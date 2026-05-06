
const Branch = require('../models/branch.model');
const connectDB = require('../lib/db');
const mongoose = require('mongoose');

// Create a new branch
exports.createBranch = async (req, res) => {
  try {
    await connectDB();
    const { branchCode, branchName } = req.body;

    if (!branchCode) {
      return res.status(400).json({ error: 'Branch code is required.' });
    }

    if (!branchName) {
      return res.status(400).json({ error: 'Branch name is required.' });
    }

    // Check if branch with this name already exists
    const existingBranch = await Branch.findOne({ branchName });
    if (existingBranch) {
      return res.status(400).json({ error: 'Branch with this name already exists.' });
    }

    const newBranch = new Branch({ branchCode, branchName });
    await newBranch.save();

    res.status(201).json({ message: 'Branch created successfully', branch: newBranch });
  } catch (err) {
    console.error('CreateBranch error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get all branches
exports.getAllBranches = async (req, res) => {
  try {
    await connectDB();
    const branches = await Branch.find({});
    res.json(branches);
  } catch (err) {
    console.error('GetAllBranches error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get a single branch by ID or branchCode
exports.getBranchById = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { branchCode: id };

    const branch = await Branch.findOne(query);

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json(branch);
  } catch (err) {
    console.error('GetBranchById error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update a branch
exports.updateBranch = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { branchName } = req.body;

    if (!branchName) {
      return res.status(400).json({ error: 'Branch name is required.' });
    }

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { branchCode: id };

    const updatedBranch = await Branch.findOneAndUpdate(query, { branchName }, {
      new: true,
      runValidators: true,
    });

    if (!updatedBranch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json({ message: 'Branch updated successfully', branch: updatedBranch });
  } catch (err) {
    console.error('UpdateBranch error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Branch name already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
};

// Delete a branch
exports.deleteBranch = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { branchCode: id };

    const deletedBranch = await Branch.findOneAndDelete(query);

    if (!deletedBranch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json({ message: 'Branch deleted successfully' });
  } catch (err) {
    console.error('DeleteBranch error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Bulk upload branches
exports.bulkUploadBranches = async (req, res) => {
  try {
    await connectDB();
    const { branches } = req.body;

    if (!Array.isArray(branches) || branches.length === 0) {
      return res.status(400).json({ error: 'Branches array is required and cannot be empty' });
    }

    const success = [];
    const failed = [];

    for (const branchData of branches) {
      try {
        // Validate required fields
        if (!branchData.branchName || branchData.branchName.trim() === '') {
          throw new Error('Branch name is required');
        }

        // Check if branch with this name already exists
        const existingBranchWithName = await Branch.findOne({ branchName: branchData.branchName });
        if (existingBranchWithName) {
          throw new Error('Branch with this name already exists');
        }

        // Check if branchCode is unique if provided
        if (branchData.branchCode && branchData.branchCode.trim() !== '') {
          const existingBranchWithCode = await Branch.findOne({ branchCode: branchData.branchCode });
          if (existingBranchWithCode) {
            throw new Error('Branch code already exists');
          }
        }

        // Create new branch
        const newBranch = new Branch({
          branchCode: branchData.branchCode,
          branchName: branchData.branchName
        });

        await newBranch.save();
        success.push(newBranch);
      } catch (err) {
        failed.push({
          member: branchData,
          error: err.message
        });
      }
    }

    res.status(201).json({
      message: `Bulk upload completed. ${success.length} branches created, ${failed.length} failed.`,
      success,
      failed
    });
  } catch (err) {
    console.error('BulkUploadBranches error:', err);
    res.status(500).json({ error: 'Failed to process bulk upload', details: err.message });
  }
};
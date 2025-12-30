
const Branch = require('../models/branch.model');
const connectDB = require('../lib/db');
const mongoose = require('mongoose');

// Create a new branch
exports.createBranch = async (req, res) => {
  try {
    await connectDB();
    const { branchName } = req.body;

    if (!branchName) {
      return res.status(400).json({ error: 'Branch name is required.' });
    }

    // Check if branch with this name already exists
    const existingBranch = await Branch.findOne({ branchName });
    if (existingBranch) {
      return res.status(400).json({ error: 'Branch with this name already exists.' });
    }

    const newBranch = new Branch({ branchName });
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

// Get a single branch by ID or branchId
exports.getBranchById = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { branchId: id };

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
      : { branchId: id };

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
      : { branchId: id };

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

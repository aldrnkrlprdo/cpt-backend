
const CapitalBuild = require('../models/capitalBuild.model');
const connectDB = require('../lib/db');

// Create a new capital contribution
exports.createContribution = async (req, res) => {
  try {
    await connectDB();
    const newContribution = new CapitalBuild(req.body);
    await newContribution.save();
    res.status(201).json({ message: 'Contribution created successfully', contribution: newContribution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all contributions with filtering
exports.getAllContributions = async (req, res) => {
  try {
    await connectDB();
    const { employeeId, month } = req.query;
    const filter = {};

    if (employeeId) filter.employee = employeeId;
    if (month) filter.contributionMonth = month;

    const contributions = await CapitalBuild.find(filter).populate('employee');
    res.json(contributions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single contribution by ID
exports.getContributionById = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const contribution = await CapitalBuild.findById(id).populate('employee');
    if (!contribution) return res.status(404).json({ error: 'Contribution not found' });
    res.json(contribution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a contribution
exports.updateContribution = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const updatedContribution = await CapitalBuild.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updatedContribution) return res.status(404).json({ error: 'Contribution not found' });
    res.json({ message: 'Contribution updated successfully', contribution: updatedContribution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a contribution
exports.deleteContribution = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const deletedContribution = await CapitalBuild.findByIdAndDelete(id);
    if (!deletedContribution) return res.status(404).json({ error: 'Contribution not found' });
    res.json({ message: 'Contribution deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const mongoose = require('mongoose');

const capitalBuildSchema = new mongoose.Schema({
  contributionId: {
    type: String,
    unique: true,
    required: true,
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  contributionAmount: {
    type: Number,
    required: true,
  },
  contributionDate: {
    type: Date,
    default: Date.now,
  },
  contributionMonth: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const CapitalBuild = mongoose.model('CapitalBuild', capitalBuildSchema);

module.exports = CapitalBuild;

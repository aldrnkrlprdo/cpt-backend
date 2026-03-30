const mongoose = require('mongoose');
const capitalBuildSchema = new mongoose.Schema({
  contributionId: {
    type: String,
    unique: true,
    required: true,
  },
  employeeId: {
    type: String,
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
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

capitalBuildSchema.virtual('employee', {
  ref: 'Employee',
  localField: 'employeeId',
  foreignField: 'employeeId',
  justOne: true
});

module.exports = mongoose.model('CapitalBuild', capitalBuildSchema);
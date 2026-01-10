
const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  branchCode: {
    type: String,
    unique: true,
  },
  branchName: {
    type: String,
    required: true,
    unique: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);

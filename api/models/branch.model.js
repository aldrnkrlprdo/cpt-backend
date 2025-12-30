
const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  branchId: {
    type: String,
    unique: true,
  },
  branchName: {
    type: String,
    required: true,
    unique: true,
  },
}, { timestamps: true });

// Pre-save hook to generate branchId
branchSchema.pre('save', async function (next) {
  if (this.isNew && !this.branchId) {
    const Branch = this.constructor;
    const lastBranch = await Branch.findOne({}, {}, { sort: { 'createdAt': -1 } });

    let nextId;
    if (lastBranch && lastBranch.branchId) {
      const lastIdNum = parseInt(lastBranch.branchId.replace('BR-', ''), 10);
      nextId = lastIdNum + 1;
    } else {
      nextId = 101; // Start from BR-101
    }
    this.branchId = `BR-${nextId}`;
  }
  next();
});

module.exports = mongoose.model('Branch', branchSchema);

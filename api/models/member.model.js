
const mongoose = require('mongoose');
const memberSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  membershipId: {
    type: String,
    unique: true
  },
  dateOfJoining: {
    type: Date,
    default: Date.now,
  },
  membershipStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'resigned'],
    default: 'active',
  },
  address: {
    street: String,
    city: String,
    province: String,
    zipCode: String,
  },
  phoneNumber: String,
}, { timestamps: true });

// Pre-save hook to generate membershipId
memberSchema.pre('save', async function (next) {
  if (this.isNew && !this.membershipId) {
    let isUnique = false;
    let newId;
    while (!isUnique) {
      // Generate a random 6-digit ID
      newId = Math.floor(100000 + Math.random() * 900000).toString();
      const existingMember = await mongoose.model('Member').findOne({ membershipId: newId });
      if (!existingMember) {
        isUnique = true;
      }
    }
    this.membershipId = newId;
  }
  next();
});

module.exports = mongoose.model('Member', memberSchema);

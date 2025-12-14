
const Member = require('../models/member.model');
const User = require('../models/user.model');
const connectDB = require('../lib/db');

// Create a new member profile
exports.createMember = async (req, res) => {
  try {
    await connectDB();
    const { firstName, lastName, email, membershipId, address, phoneNumber } = req.body;

    // Check if member with this email already exists
    const existingMemberWithEmail = await Member.findOne({ email });
    if (existingMemberWithEmail) {
      return res.status(400).json({ error: 'Member with this email already exists' });
    }

    // Check if membershipId is unique
    if (membershipId !== undefined) {
      const existingMemberWithId = await Member.findOne({ membershipId });
      if (existingMemberWithId) {
        return res.status(400).json({ error: 'Membership ID is already in use' });
      }
    }

    const newMember = new Member({
      firstName,
      lastName,
      email,
      membershipId,
      address,
      phoneNumber,
    });

    await newMember.save();
    res.status(201).json({ message: 'Member created successfully', member: newMember });
  } catch (err) {
    console.error('CreateMember error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get all members
exports.getAllMembers = async (req, res) => {
  try {
    await connectDB();
    const members = await Member.find();
    res.json(members);
  } catch (err) {
    console.error('GetAllMembers error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get a single member by ID
exports.getMemberById = async (req, res) => {
  try {
    await connectDB();
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (err) {
    console.error('GetMemberById error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update a member's details
exports.updateMember = async (req, res) => {
  try {
    await connectDB();
    const { firstName, lastName, email, membershipStatus, address, phoneNumber } = req.body;

    const updatedMember = await Member.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, membershipStatus, address, phoneNumber },
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member updated successfully', member: updatedMember });
  } catch (err) {
    console.error('UpdateMember error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Delete a member profile
exports.deleteMember = async (req, res) => {
  try {
    await connectDB();
    const deletedMember = await Member.findByIdAndDelete(req.params.id);
    if (!deletedMember) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    console.error('DeleteMember error:', err);
    res.status(500).json({ error: err.message });
  }
};

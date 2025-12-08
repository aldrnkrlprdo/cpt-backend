
const Member = require('../models/member.model');
const User = require('../models/user.model');
const connectDB = require('../lib/db');

// Create a new member profile
exports.createMember = async (req, res) => {
  try {
    await connectDB();
    const { userId, membershipId, address, phoneNumber } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if member profile already exists for this user
    const existingMemberForUser = await Member.findOne({ user: userId });
    if (existingMemberForUser) {
      return res.status(400).json({ error: 'Member profile already exists for this user' });
    }

    // Check if membershipId is unique
    const existingMemberWithId = await Member.findOne({ membershipId });
    if (existingMemberWithId) {
      return res.status(400).json({ error: 'Membership ID is already in use' });
    }

    const newMember = new Member({
      user: userId,
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
    const members = await Member.find().populate('user', 'firstName lastName email username');
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
    const member = await Member.findById(req.params.id).populate('user', 'firstName lastName email username');
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
    const { membershipStatus, address, phoneNumber } = req.body;

    const updatedMember = await Member.findByIdAndUpdate(
      req.params.id,
      { membershipStatus, address, phoneNumber },
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email username');

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

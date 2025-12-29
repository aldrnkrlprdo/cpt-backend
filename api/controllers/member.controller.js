
const connectDB = require('../lib/db');
const Member = require('../models/member.model');
const mongoose = require('mongoose');

// Create a new member profile
exports.createMember = async (req, res) => {
  try {
    await connectDB();
    const { firstName, lastName, email, employeeId, address, phoneNumber } = req.body;

    // Check if member with this email already exists
    const existingMemberWithEmail = await Member.findOne({ email });
    if (existingMemberWithEmail) {
      return res.status(400).json({ error: 'Member with this email already exists' });
    }

    // Check if employeeId is unique
    if (employeeId !== undefined) {
      const existingMemberWithId = await Member.findOne({ employeeId });
      if (existingMemberWithId) {
        return res.status(400).json({ error: 'Employee ID is already in use' });
      }
    }

    const newMember = new Member({
      firstName,
      lastName,
      email,
      employeeId,
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
    const { name, employeeId, email, status } = req.query;
    const filter = {};

    if (name) {
      filter.$or = [
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } },
      ];
    }

    if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

    if (status) {
      filter.membershipStatus = status;
    }

    const members = await Member.find(filter);
    res.json(members);
  } catch (err) {
    console.error('GetAllMembers error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get a single member by ID or employeeId
exports.getMemberById = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    let member;

    if (mongoose.Types.ObjectId.isValid(id)) {
      member = await Member.findById(id);
    } else {
      member = await Member.findOne({ employeeId: id });
    }

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (err) {
    console.error('GetMemberById error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update a member's details by ID or employeeId
exports.updateMember = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { firstName, lastName, email, membershipStatus, address, phoneNumber } = req.body;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { employeeId: id };

    const updatedMember = await Member.findOneAndUpdate(
      query,
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

// Delete a member profile by ID or employeeId
exports.deleteMember = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { employeeId: id };

    const deletedMember = await Member.findOneAndDelete(query);

    if (!deletedMember) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    console.error('DeleteMember error:', err);
    res.status(500).json({ error: err.message });
  }
};

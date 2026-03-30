
const connectDB = require('../lib/db');
const Member = require('../models/member.model');
const mongoose = require('mongoose');

// Create a new member profile
exports.createMember = async (req, res) => {
  try {
    await connectDB();
    const { firstName, middleName, lastName, email, employeeId, branch, dateOfJoining, membershipStatus, address, phoneNumber } = req.body;

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
      middleName,
      lastName,
      email,
      employeeId,
      branch,
      dateOfJoining,
      membershipStatus,
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
    const { firstName, lastName, middleName, employeeId, email, status, branch } = req.query;
    const filter = {};

    if (firstName) {
      filter.firstName = { $regex: firstName, $options: 'i' };
    }

    if (middleName) {
      filter.middleName = { $regex: middleName, $options: 'i' };
    }

    if (lastName) {
      filter.lastName = { $regex: lastName, $options: 'i' };
    }

    if (employeeId) {
      filter.employeeId = { $regex: employeeId, $options: 'i' };
    }

    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

    if (status) {
      filter.membershipStatus = { $regex: status, $options: 'i' };
    }

    if (branch) {
      filter.branch = { $regex: branch, $options: 'i' };
    }

    const members = await Member.find(filter).populate('branch');
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
      member = await Member.findById(id).populate('branch');
    } else {
      member = await Member.findOne({ employeeId: id }).populate('branch');
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
    const { firstName, middleName, lastName, email, branch, dateOfJoining, membershipStatus, address, phoneNumber } = req.body;

    const updatedMember = await Member.findOneAndUpdate(
      {employeeId: id },
      { firstName, middleName, lastName, email, branch, dateOfJoining, membershipStatus, address, phoneNumber },
      { new: true, runValidators: true }
    ).populate('branch');

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


const connectDB = require('../lib/db');
const Member = require('../models/member.model');
const mongoose = require('mongoose');

// Create a new member profile
exports.createMember = async (req, res) => {
  try {
    await connectDB();
    const { firstName, middleName, lastName, email, employeeId, branch, dateOfJoining, membershipStatus, address, phoneNumber, civilStatus } = req.body;

    // Check if member with this email already exists, but only if email is provided
    if (email && email.trim() !== '') {
      const existingMemberWithEmail = await Member.findOne({ email });
      if (existingMemberWithEmail) {
        return res.status(400).json({ error: 'Member with this email already exists' });
      }
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
      civilStatus
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
    const { firstName, middleName, lastName, email, branch, dateOfJoining, membershipStatus, address, phoneNumber, civilStatus } = req.body;

    // If email is being updated, check if it's already in use by another member
    if (email && email.trim() !== '') {
      const existingMemberWithEmail = await Member.findOne({ email, employeeId: { $ne: id } });
      if (existingMemberWithEmail) {
        return res.status(400).json({ error: 'Member with this email already exists' });
      }
    }
    
    const updatedMember = await Member.findOneAndUpdate(
      {employeeId: id },
      { firstName, middleName, lastName, email, branch, dateOfJoining, membershipStatus, address, phoneNumber, civilStatus },
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

// Validate bulk member upload
exports.validateBulkUpload = async (req, res) => {
  try {
    await connectDB();
    const { members } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Members array is required and cannot be empty' });
    }

    const valid = [];
    const invalid = [];

    for (const member of members) {
      const errors = [];

      // Validate required fields
      if (!member.firstName || member.firstName.trim() === '') {
        errors.push('First name is required');
      }
      if (!member.lastName || member.lastName.trim() === '') {
        errors.push('Last name is required');
      }

      // Validate email format if provided
      if (member.email && member.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(member.email)) {
          errors.push('Invalid email format');
        }

        // Check if email already exists
        const existingMemberWithEmail = await Member.findOne({ email: member.email });
        if (existingMemberWithEmail) {
          errors.push('Email already exists in the system');
        }
      }

      // Validate employeeId if provided
      if (member.employeeId !== undefined && member.employeeId !== null && member.employeeId !== '') {
        const existingMemberWithId = await Member.findOne({ employeeId: member.employeeId });
        if (existingMemberWithId) {
          errors.push('Employee ID already exists in the system');
        }
      }

      // Validate phone number format if provided
      if (member.phoneNumber && member.phoneNumber.trim() !== '') {
        const phoneRegex = /^[0-9+\-\s()]+$/;
        if (!phoneRegex.test(member.phoneNumber)) {
          errors.push('Invalid phone number format');
        }
      }

      // Validate membership status
      const validStatuses = ['Active', 'Inactive', 'Suspended'];
      if (member.membershipStatus && !validStatuses.includes(member.membershipStatus)) {
        errors.push(`Invalid membership status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Validate civil status
      const validCivilStatuses = ['Single', 'Married', 'Widowed', 'Divorced', 'Separated'];
      if (member.civilStatus && !validCivilStatuses.includes(member.civilStatus)) {
        errors.push(`Invalid civil status. Must be one of: ${validCivilStatuses.join(', ')}`);
      }

      // Validate date format if provided
      if (member.dateOfJoining) {
        const date = new Date(member.dateOfJoining);
        if (isNaN(date.getTime())) {
          errors.push('Invalid date of joining format');
        }
      }

      if (errors.length > 0) {
        invalid.push({ member, errors });
      } else {
        valid.push(member);
      }
    }

    res.json({ valid, invalid });
  } catch (err) {
    console.error('ValidateBulkUpload error:', err);
    res.status(500).json({ error: 'Failed to validate bulk upload', details: err.message });
  }
};

// Bulk upload members
exports.bulkUploadMembers = async (req, res) => {
  try {
    await connectDB();
    const { members } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Members array is required and cannot be empty' });
    }

    const success = [];
    const failed = [];

    for (const memberData of members) {
      try {
        // Validate required fields
        if (!memberData.firstName || memberData.firstName.trim() === '') {
          throw new Error('First name is required');
        }
        if (!memberData.lastName || memberData.lastName.trim() === '') {
          throw new Error('Last name is required');
        }

        // Check if member with this email already exists, but only if email is provided
        if (memberData.email && memberData.email.trim() !== '') {
          const existingMemberWithEmail = await Member.findOne({ email: memberData.email });
          if (existingMemberWithEmail) {
            throw new Error('Member with this email already exists');
          }
        }

        // Check if employeeId is unique if provided
        if (memberData.employeeId !== undefined && memberData.employeeId !== null && memberData.employeeId !== '') {
          const existingMemberWithId = await Member.findOne({ employeeId: memberData.employeeId });
          if (existingMemberWithId) {
            throw new Error('Employee ID is already in use');
          }
        }

        // Create new member
        const newMember = new Member({
          firstName: memberData.firstName,
          middleName: memberData.middleName,
          lastName: memberData.lastName,
          email: memberData.email,
          employeeId: memberData.employeeId,
          branch: memberData.branch,
          dateOfJoining: memberData.dateOfJoining || new Date().getDate(),
          membershipStatus: memberData.membershipStatus || 'Active',
          address: memberData.address,
          phoneNumber: memberData.phoneNumber,
          civilStatus: memberData.civilStatus
        });

        await newMember.save();
        success.push(newMember);
      } catch (err) {
        failed.push({
          member: memberData,
          error: err.message
        });
      }
    }

    res.status(201).json({
      message: `Bulk upload completed. ${success.length} members created, ${failed.length} failed.`,
      success,
      failed
    });
  } catch (err) {
    console.error('BulkUploadMembers error:', err);
    res.status(500).json({ error: 'Failed to process bulk upload', details: err.message });
  }
};
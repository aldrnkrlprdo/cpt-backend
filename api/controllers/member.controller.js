
const User = require('../models/user.model');
const connectDB = require('../lib/db');
const bcrypt = require('bcryptjs');

// @desc    Get all members
// @route   GET /api/members
// @access  Private/Admin
exports.getAllMembers = async (req, res) => {
  try {
    await connectDB();
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('GetAllMembers error:', err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Create a new member
// @route   POST /api/members
// @access  Private/Admin
exports.createMember = async (req, res) => {
  const { firstName, lastName, username, email, password, role, status } = req.body;

  try {
    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      role,
      status
    });

    const member = user.toObject();
    delete member.password;

    res.status(201).json({ message: 'Member created successfully', member });
  } catch (err) {
    console.error('CreateMember error:', err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get a single member by ID
// @route   GET /api/members/:id
// @access  Private/Admin
exports.getMemberById = async (req, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Member not found' });
    res.json(user);
  } catch (err) {
    console.error('GetMemberById error:', err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Update a member
// @route   PUT /api/members/:id
// @access  Private/Admin
exports.updateMember = async (req, res) => {
  try {
    await connectDB();
    const { firstName, lastName, email, username, role, status } = req.body;
    const updateData = { firstName, lastName, email, username, role, status };

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) return res.status(404).json({ error: 'Member not found' });

    res.json({ message: 'Member updated successfully', user });
  } catch (err) {
    console.error('UpdateMember error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email or username already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
};

// @desc    Delete a member
// @route   DELETE /api/members/:id
// @access  Private/Admin
exports.deleteMember = async (req, res) => {
  try {
    await connectDB();
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) return res.status(404).json({ error: 'Member not found' });

    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    console.error('DeleteMember error:', err);
    res.status(500).json({ error: err.message });
  }
};

const connectDB = require('../lib/db'); // ✅ import DB connection
const User = require('../models/user.model');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    await connectDB();
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('GetAllUsers error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  const { firstName, lastName, username, email, password, role, status } = req.body;

  try {
    await connectDB();

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      role,
      status,
    });

    await newUser.save();
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({ message: 'User created successfully', user: userResponse });
  } catch (err) {
    console.error('CreateUser error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get a single user by ID or username
exports.getUserById = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    let user;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { username: id };

    user = await User.findOne(query).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('GetUserById error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update a user's details by ID or username
exports.updateUser = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { firstName, lastName, email, username, role, status, password } = req.body;

    // Prevent empty updates
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No update data provided.' });
    }

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { username: id };

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    // Hash password if provided
    if (password) {
      if (password.trim().length < 6) { // Example validation
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findOneAndUpdate(query, { $set: updateData }, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    console.error('UpdateUser error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email or username already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
};

// Delete a user by ID or username
exports.deleteUser = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { username: id };

    const deletedUser = await User.findOneAndDelete(query);

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('DeleteUser error:', err);
    res.status(500).json({ error: err.message });
  }
};

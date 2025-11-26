const User = require('../models/user.model');
const connectDB = require('../lib/db'); // ✅ import DB connection

exports.getAllUsers = async (req, res) => {
  try {
    await connectDB(); // ⬅ ensure DB connected
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error('GetAllUsers error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    await connectDB(); // ⬅ ensure DB connected
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    console.error('CreateUser error:', err);
    res.status(500).json({ error: err.message });
  }
};

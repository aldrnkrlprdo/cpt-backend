
const Employee = require('../models/employee.model');
const connectDB = require('../lib/db');
const mongoose = require('mongoose');

// Create a new employee
exports.createEmployee = async (req, res) => {
  try {
    await connectDB();
    const newEmployee = new Employee(req.body);
    await newEmployee.save();
    res.status(201).json({ message: 'Employee created successfully', employee: newEmployee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all employees with filtering
exports.getAllEmployees = async (req, res) => {
  try {
    await connectDB();
    const { name, employeeId, email, status, branch } = req.query;
    const filter = {};

    if (name) {
      filter.$or = [
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } },
        { middleName: { $regex: name, $options: 'i' } },
      ];
    }
    if (employeeId) filter.employeeId = employeeId;
    if (email) filter.email = { $regex: email, $options: 'i' };
    if (status) filter.membershipStatus = status;
    if (branch) filter.branch = { $regex: branch, $options: 'i' };

    const employees = await Employee.find(filter);
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single employee by ID or employeeId
exports.getEmployeeById = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { employeeId: id };
    const employee = await Employee.findOne(query);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update an employee
exports.updateEmployee = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { employeeId: id };
    const updatedEmployee = await Employee.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    if (!updatedEmployee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee updated successfully', employee: updatedEmployee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete an employee
exports.deleteEmployee = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { employeeId: id };
    const deletedEmployee = await Employee.findOneAndDelete(query);
    if (!deletedEmployee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

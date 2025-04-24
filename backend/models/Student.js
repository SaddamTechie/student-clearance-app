// server/models/Student.js
const mongoose = require('mongoose');

const obligationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'partial', 'cleared'], default: 'pending' },
  department: { type: String, required: true },
});

const clearanceStatusSchema = new mongoose.Schema({
  department: { type: String, required: true },
  status: { type: String, enum: ['pending', 'cleared', 'rejected'], default: 'pending' },
  comment: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  yearOfStudy: { type: Number, required: true },
  obligations: [obligationSchema],
  clearanceStatus: [clearanceStatusSchema],
  clearanceHistory: [{
    department: String,
    status: String,
    comment: String,
    timestamp: { type: Date, default: Date.now },
  }],
  academicIssues: [{
    type: { type: String, required: true },
    description: { type: String, required: true },
    resolved: { type: Boolean, default: false },
  }],
  pushToken: { type: String },
  clearanceRequestStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: null },
  clearanceRequestDepartment: { type: String, default: null },
});

module.exports = mongoose.model('Student', studentSchema);
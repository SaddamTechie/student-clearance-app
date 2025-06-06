const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const staffSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String, required: true, enum: ['finance', 'library', 'department', 'hostel', 'academics'] },
  role: { type: String, default: 'staff', enum: ['staff', 'admin'] },
  pushToken: { type: String },
});

module.exports = mongoose.model('Staff', staffSchema);
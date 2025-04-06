const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // studentId or staff _id
  message: { type: String, required: true },
  type: { type: String, enum: ['clearance', 'report', 'system'], default: 'clearance' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', NotificationSchema);
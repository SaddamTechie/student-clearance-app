const mongoose = require('mongoose');

const ObligationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., "lost_book", "fee", "hostel_item"
  description: { type: String, required: true }, // e.g., "Lost book: 'Math 101'", "Hostel fee"
  amount: { type: Number, default: 0 }, // Cost to resolve (if applicable)
  resolved: { type: Boolean, default: false }, // Whether the student has cleared it
  resolvedAt: { type: Date }, // When it was resolved
});

const ClearanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  departments: {
    type: Map,
    of: [ObligationSchema], // Array of obligations per department
    default: () => new Map([
      ['finance', []],
      ['library', []],
      ['academic', []],
      ['hostel', []], // Add more departments as needed
    ]),
  },
  overallStatus: {
    type: String,
    enum: ['pending', 'cleared'],
    default: 'pending',
  },
});

const Clearance = mongoose.model('Clearance', ClearanceSchema);
module.exports = Clearance;
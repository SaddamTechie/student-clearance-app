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
    of: [ObligationSchema],
    default: () => new Map([
      ['finance', []], ['library', []], ['academic', []], ['hostel', []],
    ]),
  },
  overallStatus: { type: String, enum: ['pending', 'cleared'], default: 'pending' },
  clearanceRequested: { type: Boolean, default: false }, // New
  departmentStatus: { // New
    type: Map,
    of: String,
    default: () => new Map([
      ['finance', 'pending'], ['library', 'pending'], ['academic', 'pending'], ['hostel', 'pending'],
    ]),
  },
});

const Clearance = mongoose.model('Clearance', ClearanceSchema);
module.exports = Clearance;
// const mongoose = require('mongoose');

// const obligationSchema = new mongoose.Schema({
//   type: { type: String, required: true }, // e.g., "Library Fine"
//   description: { type: String, required: true }, // e.g., "Overdue book penalty"
//   amount: { type: Number, required: true }, // Total amount due
//   amountPaid: { type: Number, default: 0 }, // Amount paid so far
//   dueDate: { type: Date, required: true }, // e.g., "2025-06-01"
//   status: { type: String, enum: ['pending', 'partial', 'cleared'], default: 'pending' },
// });

// // const ClearanceSchema = new mongoose.Schema({
// //   studentId: { type: String, required: true, unique: true },
// //   departments: {
// //     type: Map,
// //     of: [ObligationSchema],
// //     default: () => new Map([
// //       ['finance', []], ['library', []], ['academic', []], ['hostel', []],
// //     ]),
// //   },
// //   overallStatus: { type: String, enum: ['pending', 'cleared'], default: 'pending' },
// //   clearanceRequested: { type: Boolean, default: false },
// //   departmentStatus: {
// //     type: Map,
// //     of: { type: String, enum: ['pending', 'reviewing', 'cleared', 'rejected'], default: 'pending' },
// //     default: () => new Map([
// //       ['finance', 'pending'], ['library', 'pending'], ['academic', 'pending'], ['hostel', 'pending'],
// //     ]),
// //   },
// //   comments: { type: Map, of: String }, // Optional, for staff comments
// // });

// const clearanceStatusSchema = new mongoose.Schema({
//   department: { type: String, required: true }, // e.g., "Academics", "Finance"
//   status: { type: String, enum: ['pending', 'cleared', 'rejected'], default: 'pending' },
//   comment: { type: String }, // e.g., "Missing transcript"
//   updatedAt: { type: Date, default: Date.now },
// });

// const Clearance = mongoose.model('ClearanceStatus', ClearanceStatusSchema);
// module.exports = Clearance;
// server/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const dotenv = require('dotenv');
dotenv.config();

const students = [
  {
    studentId: 'STU001',
    email: 'student1@university.edu',
    yearOfStudy: 4,
    obligations: [
      {
        type: 'Exam Fee',
        description: 'Missed exam retake fee',
        amount: 5000,
        amountPaid: 0,
        dueDate: new Date('2025-06-01'),
        status: 'pending',
        department: 'academics',
      },
      {
        type: 'Tuition Fee',
        description: 'Final semester tuition',
        amount: 100000,
        amountPaid: 0,
        dueDate: new Date('2025-05-15'),
        status: 'pending',
        department: 'finance',
      },
      {
        type: 'Room Damage Fee',
        description: 'Hostel room repair',
        amount: 3000,
        amountPaid: 0,
        dueDate: new Date('2025-06-10'),
        status: 'pending',
        department: 'hostel',
      },
    ],
    clearanceStatus: [
      { department: 'academics', status: 'pending' },
      { department: 'finance', status: 'pending' },
      { department: 'library', status: 'pending' },
      { department: 'hostel', status: 'pending' },
    ],
    academicIssues: [
      { type: 'Missed Exam', description: 'Missed CS101 final', resolved: false },
    ],
    clearanceRequestStatus: null,
    clearanceRequestDepartment: null,
  },
  {
    studentId: 'STU002',
    email: 'student2@university.edu',
    yearOfStudy: 4,
    obligations: [
      {
        type: 'Transcript Fee',
        description: 'Academic transcript processing',
        amount: 2000,
        amountPaid: 2000,
        dueDate: new Date('2025-06-10'),
        status: 'cleared',
        department: 'academics',
      },
      {
        type: 'Hostel Dues',
        description: 'Hostel accommodation fee',
        amount: 5000,
        amountPaid: 5000,
        dueDate: new Date('2025-06-01'),
        status: 'cleared',
        department: 'hostel',
      },
    ],
    clearanceStatus: [
      { department: 'academics', status: 'pending' },
      { department: 'finance', status: 'pending' },
      { department: 'library', status: 'pending' },
      { department: 'hostel', status: 'pending' },
    ],
    academicIssues: [],
    clearanceRequestStatus: null,
    clearanceRequestDepartment: null,
  },
  {
    studentId: 'STU003',
    email: 'student3@university.edu',
    yearOfStudy: 2,
    obligations: [],
    clearanceStatus: [],
    academicIssues: [],
    clearanceRequestStatus: null,
    clearanceRequestDepartment: null,
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    await Student.deleteMany({});
    for (const student of students) {
      student.password = await bcrypt.hash(student.studentId, 10);
      await Student.create(student);
    }
    console.log('Database seeded successfully');
    mongoose.disconnect();
  } catch (err) {
    console.error('Seeding failed:', err);
    mongoose.disconnect();
  }
};

seedDatabase();
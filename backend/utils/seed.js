// server/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const dotenv = require('dotenv');
const Notification = require('../models/Notification');
dotenv.config();

const students = [
  {
    studentId: 'CT201/111801/22',
    name: 'Saddam Saku',
    email: 'saddam@students.must.ac.ke',
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
    studentId: 'CT201/111802/22',
    name: 'Obadiah Muturi',
    email: 'obadiah@students.must.ac.ke',
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
    studentId: 'CT201/111803/22',
    name: 'Joseph Mwangi',
    email: 'joseph@students.must.ac.ke',
    yearOfStudy: 4,
    obligations: [
      {
        type: 'Hostel Dues',
        description: 'Broken window repair',
        amount: 5000,
        amountPaid: 5000,
        dueDate: new Date('2025-06-01'),
        status: 'cleared',
        department: 'hostel',
      }
    ],
    clearanceStatus: [
      { department: 'academics', status: 'cleared' },
      { department: 'finance', status: 'cleared' },
      { department: 'library', status: 'cleared' },
      { department: 'hostel', status: 'cleared' },
    ],
    academicIssues: [],
    clearanceRequestStatus: 'approved',
    clearanceRequestDepartment: null,
  },
  {
    studentId: 'CT201/111804/22',
    name: 'Waweru Martin',
    email: 'waweru@students.must.ac.ke',
    yearOfStudy: 4,
    obligations: [
      {
        type: 'Library Fee',
        description: 'Lost library book,Software Engineering 101',
        amount: 1000,
        amountPaid: 0,
        dueDate: new Date('2025-06-01'),
        status: 'pending',
        department: 'library',
      },
      {
        type: 'Tuition Fee',
        description: 'Final semester tuition',
        amount: 24000,
        amountPaid: 0,
        dueDate: new Date('2025-05-15'),
        status: 'pending',
        department: 'finance',
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
    studentId: 'CT201/109301/22',
    name: 'Sang Karanja',
    email: 'sang@students.must.ac.ke',
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
    await Notification.deleteMany({});
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

if (require.main === module) {
  seedDatabase();
}

module.exports = { 
  seedDatabase
  };
const admin = require('firebase-admin');
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const Report = require('../models/Report');
const Request = require('../models/Request');
const Notification = require('../models/Notification');
const Clearance = require('../models/Clearance')
const qrcode = require('qrcode');
const { sendEmail } = require('../utils/notifications');
const { generateCertificate } = require('../utils/pdfGenerator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { initiatePayment } = require('../utils/payment');


dotenv.config();
const secret = process.env.SECRET_KEY || 'your-default-secret-key';




// Middleware to verify token and role
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // { id, role, department (if staff) }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};


// Role-based middleware
const roleMiddleware = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
  }
  next();
};

// Helper function to send notifications
const sendNotification = async (io, userId, message, type = 'clearance') => {
  const notification = new Notification({ userId, message, type });
  await notification.save();
  // console.log(`Emitting notification to ${userId}:`, notification);
  io.to(userId).emit('notification', notification);
  //console.log(`Notification sent to ${userId}: ${message}`);
};

//Save Push notification token
router.post('/save-push-token', authMiddleware, async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id;
  console.log('Received push token:', token, 'for user:', userId);
  try {
    if (req.user.role === 'student') {
      const student = await Student.findOneAndUpdate(
        { studentId: userId },
        { pushToken: token === null ? null : token },
        { new: true }
      );
      console.log('Updated student:', student);
    } else if (['staff', 'admin'].includes(req.user.role)) {
      const staff = await Staff.findByIdAndUpdate(
        userId,
        { pushToken: token === null ? null : token },
        { new: true }
      );
      console.log('Updated staff:', staff);
    }
    res.json({ message: token === null ? 'Push token cleared' : 'Push token saved' });
  } catch (err) {
    console.error('Error saving push token:', err);
    res.status(500).json({ message: 'Failed to save push token', error: err.message });
  }
});

// Initialize Firebase Admin with service account
const firebaseCredentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
admin.initializeApp({
  credential: admin.credential.cert(firebaseCredentials),
});

const sendPushNotification = async (pushToken, message, title = 'Clearance Update') => {
  if (!pushToken) {
    console.warn('No push token provided');
    return;
  }

  const payload = {
    token: pushToken,
    notification: {
      title,
      body: message,
    },
    data: {
      someData: 'extra',
    },
    android: {
      priority: 'high',
    },
    apns: { // Optional: for iOS compatibility
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log('Push notification sent successfully:', response);
  } catch (err) {
    console.error('Failed to send push notification:', err);
    if (err.code === 'messaging/invalid-registration-token') {
      console.warn('Invalid token, consider clearing it from the database');
    }
  }
};

// Login (students and staff)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user, role;
    // Try student first
    const student = await Student.findOne({ email });
    if (student) {
      if (student.yearOfStudy !== 4) {
        return res.status(403).json({ message: 'Only final-year students can log in' });
      }
      if (await bcrypt.compare(password, student.password)) {
        user = student;
        role = 'student';
      }
    } else {
      // Try staff
      const staff = await Staff.findOne({ email });
      if (staff && (await bcrypt.compare(password, staff.password))) {
        user = staff;
        role = staff.role; // 'staff' or 'admin'
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.studentId || user._id, role }, process.env.SECRET_KEY, {
      expiresIn: '24h',
    });
    res.json({ token, role });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get current user info
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = require('jsonwebtoken').verify(token, process.env.SECRET_KEY);
    const userId = decoded.id;
    const role = decoded.role;

    let user;
    if (role === 'student') {
      user = await Student.findOne({ studentId: userId }).select('-password');
      if (!user) return res.status(404).json({ message: 'Student not found' });
    } else if (role === 'staff' || role === 'admin') {
      user = await Staff.findById(userId).select('-password');
      if (!user) return res.status(404).json({ message: 'Staff not found' });
    } else {
      return res.status(400).json({ message: 'Invalid user role' });
    }

    res.json({
      email: user.email,
      role: role,
      department: user.department || null, // Staff only
      name: user.name || null, // Students might have name
      studentId: user.studentId || null, // Students only
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});




// const generateObligations = (studentId) => {
//   const departments = ['finance', 'library', 'academic', 'hostel'];
//   const obligations = new Map();

//   departments.forEach((dept) => {
//     const numObligations = Math.floor(Math.random() * 3); // 0-2 obligations per dept
//     const deptObligations = [];

//     for (let i = 0; i < numObligations; i++) {
//       const type = dept === 'library' ? 'lost_book' : dept === 'finance' ? 'fee' : dept === 'hostel' ? 'hostel_item' : 'academic_fee';
//       const descriptions = {
//         lost_book: [`Lost book: 'Math 101'`, `Lost book: 'Physics 202'`, `Lost book: 'History 101'`],
//         fee: [`Semester fee unpaid`, `Late payment penalty`, `Lab fee`],
//         hostel_item: [`Missing bed sheet`, `Broken chair`, `Unreturned key`],
//         academic_fee: [`Exam fee unpaid`, `Thesis fee`, `Lab materials`],
//       };
//       const amount = Math.floor(Math.random() * 1000) + 100; // 100-1100 units
//       deptObligations.push({
//         type,
//         description: descriptions[type][Math.floor(Math.random() * descriptions[type].length)],
//         amount: type === 'lost_book' || type === 'fee' ? amount : 0, // Only financial obligations have amounts
//       });
//     }
//     obligations.set(dept, deptObligations);
//   });

//   return obligations;
// };





// Register Student
// router.post('/register', async (req, res) => {
//   const { studentId, name, email, password } = req.body;
//   if (!studentId || !name || !email || !password) {
//     return res.status(400).json({ message: 'All fields are required' });
//   }

//   try {
//     const existingStudent = await Student.findOne({ studentId });
//     if (existingStudent) return res.status(400).json({ message: 'Student already exists' });

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const student = new Student({ studentId, name, email, password: hashedPassword });
//     await student.save();
//     // Generate clearance with random obligations
//     const clearance = new Clearance({
//       studentId,
//       departments: generateObligations(studentId),
//     });
//     await clearance.save();
//     res.status(201).json({ message: 'Student registered', student });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// });




////////////////////////////   Administration  ///////////////////////////////////////


// Register Staff (Admin Only)
router.post('/staff/register', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { email, department } = req.body;
  if (!email || !department) return res.status(400).json({ message: 'Email and department are required' });

  try {
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) return res.status(400).json({ message: 'Staff already exists' });

    const defaultPassword = Math.random().toString(36).slice(-8); // Random 8-char password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const staff = new Staff({ email, password: hashedPassword, department, role: 'staff' });
    await staff.save();

    // Send email with default password (configure sendEmail later)
    //sendEmail(email, 'Your Staff Account', `Your login credentials: Email: ${email}, Password: ${defaultPassword}`);
    console.log(email, 'Your Staff Account', `Your login credentials: Email: ${email}, Password: ${defaultPassword}`)
    res.status(201).json({ message: 'Staff registered', staff });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update Staff Password
router.put('/staff/password', authMiddleware, roleMiddleware(['staff', 'admin']), async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Old and new passwords are required' });

  try {
    const staff = await Staff.findById(req.user.id);
    const isMatch = await bcrypt.compare(oldPassword, staff.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect old password' });

    staff.password = await bcrypt.hash(newPassword, 10);
    await staff.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


//Get staff
router.get('/staff/list', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const staff = await Staff.find({});
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch staff list', error: err.message });
  }
});



//Delete Staff
router.delete('/staff/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json({ message: 'Staff deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete staff', error: err.message });
  }
});


// Get aggregated obligations
router.get('/obligations', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view obligations' });
    }
    const student = await Student.findOne({ studentId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const totalAmount = student.obligations.reduce((sum, obl) => sum + (obl.amount - obl.paid), 0);
    res.json({
      obligations: student.obligations,
      totalAmount,
    });
  } catch (err) {
    console.error('Error fetching obligations:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

///////////////////  Student ///////////////////////////////////////////


router.post('/verify', authMiddleware, async (req, res) => {
  if (req.user.role !== 'staff') {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  const { id } = req.body;
  try {
    const clearance = await Clearance.findOne({ studentId: id });
    if (!clearance) return res.status(404).json({ message: 'Student not found' });
    const user = await Student.findOne({ studentId:id });
    if (!user) return res.status(404).json({ message: 'Student not found' });
    const obligations = clearance.departments.get(req.user.department) || [];
    res.json({
      studentId: id,
      email: user.email,
      department: req.user.department,
      obligations,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify student' });
  }
});



// Pay obligation (partial or full)
router.post('/pay-obligation', authMiddleware, async (req, res) => {
  const { obligationId, amount,phoneNumber } = req.body;
  const io = req.app.get('io');
  const studentId = req.user.id;
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can pay obligations' });
  }
  try {
    const student = await Student.findOne({ studentId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const obligation = student.obligations.id(obligationId);
    if (!obligation) {
      return res.status(404).json({ message: 'Obligation not found' });
    }
    await initiatePayment(phoneNumber, amount,studentId);
    obligation.amountPaid += amount;
    obligation.status = obligation.amountPaid >= obligation.amount ? 'cleared' : 'partial';

    // Notify via push
    if (student.pushToken) {
      await sendPushNotification(
        student.pushToken,
        `Payment of ${amount} for ${obligation.type} recorded.`,
        'Payment Update'
      );
    }

     // Notify student
     await sendNotification(io, studentId, `${obligation.type.split(' ')[0]} : ${obligation.status} - Paid ${amount}, remaining: ${obligation.amount - obligation.amountPaid}`);
    // // Update history
    // student.clearanceHistory.push({
    //   department: obligation.type.split(' ')[0], // e.g., "Library" from "Library Fine"
    //   status: obligation.status,
    //   comment: `Paid ${amount}, remaining: ${obligation.amount - obligation.amountPaid}`,
    // });

    await student.save();
    res.json({ message: 'Payment recorded', obligation });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// Get student status (obligations, clearance, history)
router.get('/status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can view status' });
  }
  try {
    const student = await Student.findOne({ studentId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({
      studentId: student.studentId,
      email: student.email,
      yearOfStudy: student.yearOfStudy,
      obligations: student.obligations,
      clearanceStatus: student.clearanceStatus,
      clearanceHistory: student.clearanceHistory,
    });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});




///////////////////////////////// Report Issues /////////////////////////////////////////



// Post Report 
router.post('/report', authMiddleware, async (req, res) => {
  const { department, message } = req.body;
  const studentId = req.user.id;

  if (!department || !message) {
    return res.status(400).json({ message: 'Department and message are required' });
  }

  try {
    const report = new Report({
      studentId,
      department,
      message,
    });
    await report.save();
    console.log(`Report from student ${studentId} to ${department}: ${message}`);
    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ message: 'Failed to submit report' });
  }
});



router.get('/reports', authMiddleware, async (req, res) => {
  if (req.user.role !== 'staff') {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  const department = req.user.department; // From token
  try {
    const reports = await Report.find({ department }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});


router.patch('/report/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'staff') {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  const { id } = req.params;
  const { status } = req.body;
  const staffDepartment = req.user.department;

  if (!['pending', 'resolved'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.department !== staffDepartment) {
      return res.status(403).json({ message: 'You can only update reports in your department' });
    }
    report.status = status;
    await report.save();
    res.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Failed to update report' });
  }
});




///////////////////////////////  Notifications  /////////////////////////////////////////


// New endpoint to get notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const user = req.user.role === 'student'
      ? await Student.findOne({ studentId: req.user.id })
      : await Staff.findById(req.user.id);
    if (user.pushToken && notifications.some(n => !n.read)) {
      await sendPushNotification(user.pushToken, 'You have unread notifications.');
    }
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user.id });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    notification.read = true;
    await notification.save();
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});



////////////////////////////////////////////   Request    ///////////////////////////////////////////////


// Student: Request clearance
router.post('/request-clearance', authMiddleware, async (req, res) => {
  
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can request clearance' });
  }
  console.log('Request clearance:', req.user);
  const io = req.app.get('io');
  const studentId = req.user.id;
  try {
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const academicObligations = student.obligations.filter((ob) => ob.department === 'academics');
    const allAcademicObligationsCleared = academicObligations.every((ob) => ob.status === 'cleared');
    
    if (!allAcademicObligationsCleared) {
      return res.status(400).json({ message: 'All Academic obligations must be cleared to request clearance' });
    }
    
    if (student.clearanceRequestStatus === 'pending' || student.clearanceRequestStatus === 'approved') {
      console.log('Request clearance already submitted');
      return res.status(400).json({ message: 'Clearance request already submitted' });
    }
    
    student.clearanceRequestStatus = 'pending';
    student.clearanceRequestDepartment = 'academics'; // Start with Academics
    
    // Notify student
    await sendNotification(io, studentId, 'Clearance request initiated');
    if (student.pushToken) {
      await sendPushNotification(student.pushToken,'Clearance request initiated' );
    }

    // student.clearanceHistory.push({
    //   department: 'System',
    //   status: 'pending',
    //   comment: 'Clearance request initiated',
    //   timestamp: new Date(),
    // });
    
    await student.save();
    if (student.pushToken) {
      await sendPushNotification(
        student.pushToken,
        'Your clearance request has been submitted to Academics.',
        'Clearance Request'
      );
    }
    console.log('Request submitted', req.user);
    res.json({ message: 'Clearance request submitted to Academics' });
  } catch (err) {
    console.error('Request clearance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// Staff: Get all student clearance requests
router.get('/staff/requests', authMiddleware, async (req, res) => {
  if (!['staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only staff can view requests' });
  }
  console.log('Staff clearance requests:', req.user);
  try {
    const staff = await Staff.findById(req.user.id);
    const department = staff.department; // e.g., 'Academics', 'Finance', etc.
    console.log('Staff department:', department);
    const students = await Student.find({
      yearOfStudy: 4,
      clearanceRequestStatus: 'pending',
      clearanceRequestDepartment: department,
    }).select('studentId clearanceStatus obligations clearanceHistory academicIssues');
    console.log('Students:', students);
    const requests = students.map((student) => {
      const deptStatus = student.clearanceStatus.find((s) => s.department === department) || {
        status: 'pending',
        comment: '',
      };
      const deptObligations = student.obligations.filter((ob) => ob.department === department);
      const deptHistory = student.clearanceHistory.filter((h) => h.department === department);
      const hasUnresolvedIssues = department === 'academics' ? student.academicIssues.some((issue) => !issue.resolved) : false;
      const allObligationsCleared = deptObligations.every((ob) => ob.status === 'cleared');
      return {
        studentId: student.studentId,
        department,
        status: deptStatus.status,
        comment: deptStatus.comment,
        obligations: deptObligations.map((ob) => ({
          _id: ob._id,
          type: ob.type,
          description: ob.description,
          amount: ob.amount,
          amountPaid: ob.amountPaid,
          dueDate: ob.dueDate,
          status: ob.status,
        })),
        clearanceHistory: deptHistory.map((h) => ({
          department: h.department,
          status: h.status,
          comment: h.comment,
          timestamp: h.timestamp,
        })),
        clearanceEligibility: department === 'academics' ? (!hasUnresolvedIssues && allObligationsCleared ? 'Cleared' : 'Not Cleared') : allObligationsCleared ? 'Cleared' : 'Not Cleared',
        academicIssues: department === 'academics' ? student.academicIssues.map((issue) => ({
          type: issue.type,
          description: issue.description,
          resolved: issue.resolved,
        })) : [],
      };
    });
    console.log('Requests:', requests);
    res.json(requests);
  } catch (err) {
    console.error('Fetch requests error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update clearance status
router.post('/staff/update-clearance', authMiddleware, async (req, res) => {
  const { studentId, department, status, comment } = req.body;
  const io = req.app.get('io');
  if (!['staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only staff can update clearance' });
  }
  try {
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const staff = await Staff.findById(req.user.id);
    if (staff.department !== department) {
      return res.status(403).json({ message: 'You can only update clearances for your department' });
    }
    const deptStatus = student.clearanceStatus.find((s) => s.department === department);
    if (!deptStatus) {
      return res.status(404).json({ message: 'Department status not found' });
    }
    const deptObligations = student.obligations.filter((ob) => ob.department === department);
    const allObligationsCleared = deptObligations.every((ob) => ob.status === 'cleared');
    if (status === 'cleared') {
      if (department === 'academics' && student.academicIssues.some((issue) => !issue.resolved)) {
        return res.status(400).json({ message: 'Cannot approve: Student has unresolved academic issues' });
      }
      if (!allObligationsCleared) {
        return res.status(400).json({ message: 'Cannot approve: Pending obligations exist' });
      }
    }
    deptStatus.status = status;
    deptStatus.comment = comment;
    deptStatus.updatedAt = new Date();
    student.clearanceHistory.push({ department, status, comment });
    if (status === 'cleared' && department === 'academics') {
      student.clearanceRequestDepartment = 'finance'; // Move to next department
    } else if (status === 'cleared' && department === 'finance') {
      student.clearanceRequestDepartment = 'library';
    } else if (status === 'cleared' && department === 'library') {
      student.clearanceRequestDepartment = 'hostel';
    } else if (status === 'cleared' && department === 'hostel') {
      student.clearanceRequestStatus = 'approved';
      student.clearanceRequestDepartment = null;
    }
    if (status === 'rejected') {
      student.clearanceRequestStatus = 'rejected';
      student.clearanceRequestDepartment = null;
    }
    await student.save();
    // Notify student
    await sendNotification(io, studentId, `Your ${department} clearance is ${status}. ${comment || ''}`);
    
    if (student.pushToken) {
      await sendPushNotification(
        student.pushToken,
        `Your ${department} request is ${status}. ${comment || ''}`,
        'Clearance Update'
      );
    }
    res.json({ message: 'Clearance updated', comment });
  } catch (err) {
    console.error('Update clearance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});




module.exports = router;
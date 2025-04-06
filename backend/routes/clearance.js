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


// Unified Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  try {
    let user = await Student.findOne({ email });
    let role = 'student';
    if (!user) {
      user = await Staff.findOne({ email });
      role = user ? user.role : null;
    }
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: role === 'student' ? user.studentId : user._id, role, department: user.department || null },
      secret,
      { expiresIn: '1h' }
    );
    res.json({ token, role, id: role === 'student' ? user.studentId : user._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});




const generateObligations = (studentId) => {
  const departments = ['finance', 'library', 'academic', 'hostel'];
  const obligations = new Map();

  departments.forEach((dept) => {
    const numObligations = Math.floor(Math.random() * 3); // 0-2 obligations per dept
    const deptObligations = [];

    for (let i = 0; i < numObligations; i++) {
      const type = dept === 'library' ? 'lost_book' : dept === 'finance' ? 'fee' : dept === 'hostel' ? 'hostel_item' : 'academic_fee';
      const descriptions = {
        lost_book: [`Lost book: 'Math 101'`, `Lost book: 'Physics 202'`, `Lost book: 'History 101'`],
        fee: [`Semester fee unpaid`, `Late payment penalty`, `Lab fee`],
        hostel_item: [`Missing bed sheet`, `Broken chair`, `Unreturned key`],
        academic_fee: [`Exam fee unpaid`, `Thesis fee`, `Lab materials`],
      };
      const amount = Math.floor(Math.random() * 1000) + 100; // 100-1100 units
      deptObligations.push({
        type,
        description: descriptions[type][Math.floor(Math.random() * descriptions[type].length)],
        amount: type === 'lost_book' || type === 'fee' ? amount : 0, // Only financial obligations have amounts
      });
    }
    obligations.set(dept, deptObligations);
  });

  return obligations;
};





// Register Student
router.post('/register', async (req, res) => {
  const { studentId, name, email, password } = req.body;
  if (!studentId || !name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) return res.status(400).json({ message: 'Student already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const student = new Student({ studentId, name, email, password: hashedPassword });
    await student.save();
    // Generate clearance with random obligations
    const clearance = new Clearance({
      studentId,
      departments: generateObligations(studentId),
    });
    await clearance.save();
    res.status(201).json({ message: 'Student registered', student });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

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

// Submit Clearance Request (Student Only)
router.post('/request', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  const { department } = req.body;
  const studentId = req.user.id;
  if (!department) return res.status(400).json({ message: 'Department is required' });

  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const request = new Request({ studentId, department });
    await request.save();
    res.status(201).json({ message: 'Request submitted', request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Approve/Reject Request (Staff Only, Department-Specific)
router.put('/approve/:requestId', authMiddleware, roleMiddleware(['staff', 'admin']), async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be "approved" or "rejected"' });
  }

  try {
    const request = await Request.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (req.user.role === 'staff' && req.user.department !== request.department) {
      return res.status(403).json({ message: 'You can only approve requests for your department' });
    }

    request.status = status;
    await request.save();

    const student = await Student.findOne({ studentId: request.studentId });
    student.clearanceStatus[request.department] = status;
    await student.save();

    const allCleared = Object.values(student.clearanceStatus).every((s) => s === 'approved');
    if (allCleared) {
      student.certificateGenerated = true;
      await student.save();
      const pdfPath = await generateCertificate(student);
      // sendEmail(student.email, 'Clearance Certificate', 'Attached is your clearance certificate.', pdfPath);
    }

    res.json({ message: `Request ${status}`, student });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get QR Code (Student Only)
router.get('/qr', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  const studentId = req.user.id;
  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const qrData = JSON.stringify({ studentId, timestamp: Date.now() });
    //const qrCode = await qrcode.toDataURL(qrData);
    res.json({ qrCode: qrData });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});




router.get('/status', authMiddleware, async (req, res) => {
  // if (req.user.role !== 'student') {
  //   return res.status(403).json({ message: 'Unauthorized' });
  // }
  try {
    const clearance = await Clearance.findOne({ studentId: req.user.id });
    if (!clearance) return res.status(404).json({ message: 'Clearance not found' });
    res.json(clearance);
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ message: 'Failed to fetch status' });
  }
});



// Get Requests (Staff Only, Department-Specific)
router.get('/requests', authMiddleware, roleMiddleware(['staff', 'admin']), async (req, res) => {
  try {
    const query = req.user.role === 'staff' ? { department: req.user.department } : {};
    const requests = await Request.find(query);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



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






router.post('/pay', authMiddleware, async (req, res) => {
  const { department, obligationIndices } = req.body;
  const studentId = req.user.id;

  try {
    const clearance = await Clearance.findOne({ studentId });
    if (!clearance) return res.status(404).json({ message: 'Clearance not found' });

    const obligations = clearance.departments.get(department);
    if (!obligations) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    // Validate indices
    if (!Array.isArray(obligationIndices) || obligationIndices.some(index => index < 0 || index >= obligations.length)) {
      return res.status(400).json({ message: 'Invalid obligation indices' });
    }

    // Resolve obligations
    obligationIndices.forEach(index => {
      const obligation = obligations[index];
      if (!obligation.resolved && obligation.amount > 0) {
        obligation.resolved = true;
        obligation.resolvedAt = new Date();
      }
    });

    clearance.departments.set(department, obligations);

    // Update overall status
    let allResolved = true;
    for (const [_, deptObligations] of clearance.departments) {
      if (deptObligations.some(o => !o.resolved && o.amount > 0)) {
        allResolved = false;
        break;
      }
    }
    clearance.overallStatus = allResolved ? 'cleared' : 'pending';

    await clearance.save();
    res.json({ message: 'Payment processed', clearance });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Payment failed' });
  }
});





// Update /request-clearance
router.post('/request-clearance', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  const studentId = req.user.id;
  const io = req.app.get('io');

  try {
    const clearance = await Clearance.findOne({ studentId });
    if (!clearance) return res.status(404).json({ message: 'Clearance not found' });
    if (clearance.clearanceRequested) {
      return res.status(400).json({ message: 'Clearance already requested' });
    }

    for (const [_, obligations] of clearance.departments) {
      if (obligations.some(obl => !obl.resolved && obl.amount > 0)) {
        return res.status(400).json({ message: 'Resolve all outstanding payments first' });
      }
    }

    clearance.clearanceRequested = true;
    clearance.departmentStatus.forEach((_, dept) => clearance.departmentStatus.set(dept, 'pending'));
    await clearance.save();

    // Notify student
    await sendNotification(io, studentId, 'Your clearance request has been initiated.');

    // Notify staff in each department
    const departments = ['finance', 'library', 'academic', 'hostel'];
    const staff = await Staff.find({ department: { $in: departments } });
    staff.forEach(async (s) => {
      await sendNotification(io, s._id.toString(), `New clearance request from ${studentId} for ${s.department}.`);
    });

    res.json({ message: 'Clearance requested', clearance });
  } catch (error) {
    console.error('Error requesting clearance:', error);
    res.status(500).json({ message: 'Failed to request clearance' });
  }
});

// Update /staff/update-clearance
router.post('/staff/update-clearance', authMiddleware, async (req, res) => {
  if (req.user.role !== 'staff') return res.status(403).json({ message: 'Unauthorized' });
  const { studentId, status, comment } = req.body;
  const io = req.app.get('io');

  if (!['pending', 'reviewing', 'cleared', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const clearance = await Clearance.findOne({ studentId });
    if (!clearance) return res.status(404).json({ message: 'Clearance not found' });

    clearance.departmentStatus.set(req.user.department, status);
    if (comment) {
      clearance.comments = clearance.comments || new Map();
      clearance.comments.set(req.user.department, comment);
    }

    const allCleared = Array.from(clearance.departmentStatus.values()).every(s => s === 'cleared');
    clearance.overallStatus = allCleared ? 'cleared' : 'pending';

    await clearance.save();

    // Notify student
    await sendNotification(
      io,
      studentId,
      `${req.user.department} updated your clearance to ${status}${comment ? `: ${comment}` : ''}`
    );

    // Notify staff if fully cleared
    if (allCleared) {
      await sendNotification(io, studentId, 'Your clearance is fully approved!');
      const staff = await Staff.find({});
      staff.forEach(async (s) => {
        await sendNotification(io, s._id.toString(), `${studentId} is fully cleared.`);
      });
    }

    res.json({ message: 'Status updated', clearance });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// New endpoint to get notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
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


router.get('/staff/requests', authMiddleware, async (req, res) => {
  if (req.user.role !== 'staff') return res.status(403).json({ message: 'Unauthorized' });
  try {
    const clearances = await Clearance.find({ 
      clearanceRequested: true, 
      [`departmentStatus.${req.user.department}`]: 'pending' 
    });
    const requests = clearances.map(c => ({
      studentId: c.studentId,
      status: c.departmentStatus.get(req.user.department),
      obligations: (c.departments.get(req.user.department) || []).map(o => o.description),
    }));
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// router.post('/staff/update-clearance', authMiddleware, async (req, res) => {
//   if (req.user.role !== 'staff') return res.status(403).json({ message: 'Unauthorized' });
//   const { studentId, status, comment } = req.body;
//   console.log('Received update:', req.body);
//   if (!['pending', 'reviewing', 'cleared', 'rejected'].includes(status)) {
//     return res.status(400).json({ message: 'Invalid status' });
//   }

//   try {
//     const clearance = await Clearance.findOne({ studentId });
//     if (!clearance) return res.status(404).json({ message: 'Clearance not found' });

//     clearance.departmentStatus.set(req.user.department, status);
//     if (comment) {
//       clearance.comments = clearance.comments || new Map();
//       clearance.comments.set(req.user.department, comment);
//     }

//     const allCleared = Array.from(clearance.departmentStatus.values()).every(s => s === 'cleared');
//     clearance.overallStatus = allCleared ? 'cleared' : 'pending';

//     await clearance.save();

//     console.log(`Notification: ${req.user.department} updated ${studentId} to ${status}`);
//     if (allCleared) console.log(`Notification: ${studentId} fully cleared`);

//     res.json({ message: 'Status updated', clearance });
//   } catch (error) {
//     console.error('Error updating status:', error);
//     res.status(500).json({ message: 'Failed to update status' });
//   }
// });



module.exports = router;
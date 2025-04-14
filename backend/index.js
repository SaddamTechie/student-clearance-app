const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const clearanceRoutes = require('./routes/clearance');
require('dotenv').config();
const {  initiatePayment } = require('./utils/payment');
const { seedDatabase } = require('./utils/seed');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for production
    methods: ['GET', 'POST'],
  },
});
app.use(express.json());
app.use(cors());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}



// Test Payment
app.get('/api/payment/:phone', async (req, res) => {
  const { phone } = req.params;
  const amount = 1000; // Amount to be paid
  await initiatePayment(phone, amount,"TESTING");
  res.status(200).json({ message: 'Payment request sent' });
}
);

// Seed
app.get('/api/seed', async (req, res) => {
  try {
    await seedDatabase();
    connectDB();
    res.status(200).json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({ message: 'Error seeding database' });
  }
});

app.use('/api/clearance', clearanceRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join a room based on user ID (studentId or staff _id)
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


app.set('io', io)

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port ${PORT}`);
});
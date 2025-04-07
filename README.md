# Clearance System

A full-stack application designed to streamline student clearance processes across departments. The system comprises a Node.js/Express backend, a React-based admin frontend, and a React Native mobile app (Expo), providing a seamless experience for staff, admins, and students.

Table of Contents
Features
Backend:
RESTful API with JWT authentication.
Real-time notifications via Socket.IO.
MongoDB integration for data persistence.
Role-based access (admin, staff, student).
Admin Frontend (React):
Responsive dashboard for staff and admins.
Manage staff (CRUD), view reports, scan QR codes, handle clearance requests, and update profiles.
Real-time notification system with filtering and read status.
Theme: Green (#7ABB3B) and Orange (#FF9933).
Mobile App (React Native - Expo):
Student-facing app to generate QR codes for clearance.
View clearance status and obligations.
Receive push notifications for updates.
Tech Stack
Backend: Node.js, Express, MongoDB, Socket.IO, JWT
Frontend (Admin): React, Tailwind CSS, React Router, Axios, Sonner (toasts), Heroicons
Mobile App: React Native, Expo, Axios, Expo Notifications
Tools: Vite (frontend build), Nodemon (backend dev), Git

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- npm (v8+)
  Expo CLI (for mobile app: npm install -g expo-cli)

git clone https://github.com/SaddamTechie/student-clearance-app.git
cd clearance-system/backend

npm install
Set Environment Variables: Create a .env file in backend/:

PORT=5000
MONGODB_URI=mongodb://localhost:27017/clearance_db
SECRET_KEY=your_jwt_secret
Run MongoDB:
Local: mongod
Atlas: Use your connection string in .env.
Start the Server:
bash

Collapse

Wrap

Copy
npm run dev # Uses Nodemon for development
Server runs at http://localhost:5000.
Frontend (Admin) Setup
Navigate to Frontend:

cd clearance-system/frontend
Install Dependencies:

npm install
Set Environment Variables: Create a .env file in frontend/:
text

VITE_API_URL=http://localhost:5000/api/clearance
Start the Development Server:

npm run dev
Frontend runs at http://localhost:5173.
Mobile App Setup
Navigate to Mobile:

cd clearance-system/mobile
Install Dependencies:
Set Environment Variables: Update api.js or use Expo config:
const API_URL = 'http://localhost:5000/api/clearance'; // Adjust for production

Start the Expo App:
npx expo start
Scan the QR code with the Expo Go app (iOS/Android) or run on an emulator.
Usage
Backend:
API serves endpoints for authentication, staff management, clearance requests, and notifications.
Socket.IO broadcasts real-time updates (e.g., new clearance requests).
Admin Frontend:
Log in with staff/admin credentials.
Navigate via the Navbar to manage staff, view reports, scan QR codes, handle requests, or check notifications.
Refreshing pages retains the current route.
Mobile App:
Log in as a student.
View clearance status or generate a QR code for staff to scan.
Receive push notifications for status updates.
Example Workflow
Admin: Registers staff via /admin panel.
Staff: Scans a student’s QR code at /scan, updates clearance at /requests.
Student: Checks status on mobile app, gets notified of updates.
API Endpoints
Authentication
POST /api/clearance/login: Authenticate user (returns JWT).
GET /api/clearance/me: Get current user info.
Staff/Admin
POST /api/clearance/staff/register: Register new staff (admin only).
GET /api/clearance/staff/list: List all staff (admin only).
DELETE /api/clearance/staff/:id: Delete staff (admin only).
PUT /api/clearance/staff/password: Update staff password.
GET /api/clearance/staff/requests: Get clearance requests for staff’s department.
POST /api/clearance/staff/update-clearance: Update clearance status.
Reports
GET /api/clearance/reports: Get department reports.
PATCH /api/clearance/report/:id: Update report status.
Notifications
GET /api/clearance/notifications: Get user notifications.
PATCH /api/clearance/notifications/:id/read: Mark notification as read.
QR Verification
POST /api/clearance/verify: Verify student QR code.

Assumptions
We assume that the staff and students are already registered in the school sysytem and have already been issued with emails. But because we don't have access to the system to login students or staff and get their data, we opted to register them to generate the data we need.

Analytics: Add to staff dashboard later with a /staff/stats endpoint. Messaging: Expand with a /staff/message endpoint and UI. Full Dashboard: Integrate StaffDashboard into your admin panel’s routing

Card for all departments with a label 'Resolved' or 'Not Resolved' and I can click into the specific department,see the obligations for that department,then I can maybe pay for them and after all gets resolved,I can go back and even the label on that department card woould have changed to resolved,and when all the obligations on all departments are resolved is when I can be able to send the Request.

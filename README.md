# Student Clearance System

A modern, full-stack application for managing student clearance processes in Meru University of Science & Technology. The system provides an **admin dashboard** for managing students and staff, a **staff dashboard** for handling clearance requests, and a **mobile app** for students to track their clearance status and download certificates.

---

## Table of Contents

- Features
- Tech Stack
- Installation
  - Prerequisites
  - Backend Setup
  - Frontend Setup
  - Mobile App Setup
- Usage
  - Admin Dashboard
  - Staff Dashboard
  - Student Mobile App
- API Endpoints

---

## Features

### Admin Dashboard (Web)

- View and filter students by year to check clearance status.
- Manage staff accounts (add/delete).
- Responsive design with Tailwind CSS.
- Error handling with `sonner` toasts.

### Staff Dashboard (Web)

- View clearance requests.
- Approve or reject student clearance requests with comments.
- View student obligations.
- Mobile-friendly card layout for small screens.

### Student Mobile App

- View real-time clearance status across departments (e.g., finance, library).
- Download clearance certificates as PDFs.
- Generate QR code.
- Push notifications.
- User-friendly interface built with React Native and Expo.

### Backend

- Secure API with JWT authentication.
- MongoDB for storing student, staff, and clearance data.
- PDF generation for clearance certificates using PDFKit.
- Server-side filtering and validation.

---

## Tech Stack

| Component    | Technologies                                                |
| ------------ | ----------------------------------------------------------- |
| **Backend**  | Node.js, Express, MongoDB, JWT, PDFKit                      |
| **Frontend** | React, React Router, Axios, Tailwind CSS, Sonner, Heroicons |
| **Mobile**   | React Native, Expo, Axios                                   |
| **Database** | MongoDB                                                     |
| **Tools**    | Git, npm, VS Code, Postman, EAS Build                       |

---

## Installation

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local or Atlas)
- **Git**
- **Expo CLI** (for mobile app)
- **Postman** (optional, for API testing)

Clone the repository:

```bash
git clone https://github.com/SaddamTechie/student-clearance-app.git
cd student-clearance-app
```

### Backend Setup

1. Navigate to the backend folder:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file:

   ```env
   MONGO_URI=<Your_MONGO_URI>
   PORT=5000
   SECRET_KEY=<JWT_SECRET_KEY>
   EMAIL_USER=<Your_Email>
   EMAIL_PASS=<Your_Email_Password>
   FIREBASE_SERVICE_ACCOUNT=<Your_Firebase_Service_Account_Configuration>
   CONSUMER_KEY=<Your_Mpesa_Consumer_Key>
   CONSUMER_SECRET=<Your_Mpesa_Consumer_Secret>
   PASS_KEY=<Your_Mpesa_Pass_Key>
   SHORT_CODE=<Your_Mpesa_Short_Code>
   ```

4. Start MongoDB (if local):

   ```bash
   mongod
   ```

   Prefer using Mongodb Atlas on Cloud.

5. Seed initial data:

```bash
 node utils/seed.js
```

6. Start the backend:

   ```bash
   npm start
   ```

   The API will run at `http://localhost:5000`.

### Frontend Setup

1. Navigate to the frontend folder:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file and update with the backend URL:

   ```.env
   VITE_API_URL=http://localhost:5000/api/clearance
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. Start the frontend:

   ```bash
   npm run dev
   ```

   The admin dashboard will run at `http://localhost:5173`.

### Mobile App Setup

1. Navigate to the mobile app folder:

   ```bash
   cd mobile-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Update API URL in `config.js`:

   ```javascript
   export const apiUrl = "http://localhost:5000/api/clearance";
   export const socketUrl = "http://localhost:5000";
   ```

4. Start the Expo development server:

```bash
npx expo start
```

or

```bash
npx expo start --tunnel # To avoid network issues(access it from different network)
```

5. Scan the QR code with the Expo Go app (iOS/Android) or run on an emulator.

---

## Usage

### Admin Dashboard

- **URL**: `http://localhost:5173`
- **Login**: Use admin credentials (e.g., email: `admin@example.com`).
- **Features**:
  - **Students**: View/filter students by year, check clearance status.
  - **Staff**: Add/delete staff members.
  - Navigate via `/students` or `/` for staff.
  - View issues reported by students.

### Staff Dashboard

- **URL**: `http://localhost:5173/`
- **Login**: Use staff credentials.
- **Features**:
  - View clearance requests.
  - Approve/reject requests with comments.
  - Check student obligations.
  - Scan QR code

### Student Mobile App

- **Launch**: Open via Expo Go or build APK/iOS app.
- **Login**: Use student credentials.
- **Features**:
  - View clearance status per department.
  - Download clearance certificate if fully cleared.
  - Generate QR code for verification
  - Get push notification updates
  - Report issues to administration

---

## API Endpoints

| Method | Endpoint                      | Description                       | Auth Required |
| ------ | ----------------------------- | --------------------------------- | ------------- |
| GET    | `/admin/students?year=<year>` | List students, filter by year     | Admin         |
| POST   | `/staff/register`             | Register new staff                | Admin         |
| DELETE | `/staff/:staffId`             | Delete staff                      | Admin         |
| GET    | `/staff/requests`             | List clearance requests for staff | Staff         |
| POST   | `/staff/update-clearance`     | Update clearance request status   | Staff         |
| GET    | `/certificate`                | Download clearance certificate    | Student       |
| POST   | `/login`                      | Authenticate user                 | None          |

**Example Request**:

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:5000/certificate" -o certificate.pdf
```

---

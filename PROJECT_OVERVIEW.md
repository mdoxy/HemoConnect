# 🩸 Blood Donation & Request Management System

## 📋 Project Overview

This is a comprehensive web-based blood donation and blood request management system designed to connect blood donors, patients in need of blood, and hospitals/medical facilities. The platform facilitates blood donation drive coordination, blood request processing, and donor health screening management.

---

## 🎯 Core Features

### 1. **Blood Request System**
Allows patients and medical professionals to request blood units from hospitals.

**Flow:**
- User navigates to "Find Blood" section
- Selects hospital or uses location-based search
- Fills blood request form (patient details, blood group, units needed)
- Uploads required documents (prescription) and optional ID proof
- Request submitted with automatic userId tracking
- Status tracked in real-time (Pending → Approved/Rejected)

**Status Lifecycle:**
- 🟡 **Pending** - Request submitted, awaiting hospital review
- 🟢 **Approved** - Hospital approved the request
- 🔴 **Rejected** - Hospital rejected with reason

### 2. **Donor Management System**
Manages blood donors, their health screening, and donation scheduling.

**Features:**
- **"Become a Donor"** module with multi-step health screening questionnaire
- Donor verification with document uploads (ID, employment verification)
- Health screening form validation (age, weight, medical history, blood tests)
- Application status tracking (Pending → Screening → Approved/Rejected)
- Donor Dashboard showing application status and scheduled appointments

### 3. **Donation Scheduling**
Donors can schedule their blood donations after application approval.

**Features:**
- Schedule donation button (only visible when application approved)
- Date selection: 0-90 days from today
- Time selection: 16 available slots (8:00 AM - 5:30 PM, 30-min intervals)
- Reschedule capability to change appointment
- Hospital panel visibility of scheduled appointments

### 4. **Hospital Panel**
Administrative interface for hospital staff to manage requests and donors.

**Capabilities:**
- View pending blood requests with document preview
- Approve/reject requests with optional rejection reasons
- View approved donors with contact information
- See donation schedules and reschedules
- Real-time status updates sent to requestors

### 5. **Blood Bank Inventory**
Tracks available blood units by type and blood bank location.

**Data:**
- CSV-based blood bank inventory
- Blood types: O-, O+, A-, A+, B-, B+, AB-, AB+
- Unit availability by bank location

### 6. **Hospital Locator**
Map-based hospital/blood bank finder with searchable list.

**Features:**
- Interactive map showing hospital locations (using Leaflet.js)
- Hospital list with filtering
- Search by name, location, or blood type availability
- Hospital details including address, phone, type

### 7. **Education Hub**
Educational resources about blood donation and blood types.

---

## 👥 User Roles & Access

### 1. **Donor**
- Apply to become blood donor
- Complete health screening questionnaire
- Upload verification documents
- Schedule/reschedule donation appointments
- View application status
- Access donor dashboard

### 2. **Requestor**
- Request blood from hospitals
- Upload medical prescriptions
- Track request status
- View approval/rejection reasons
- Requestor dashboard for all personal requests

### 3. **Hospital Staff**
- Review blood requests from patients
- Approve/reject requests with reasons
- View and manage approved donors
- See scheduled appointments
- Manage hospital blood inventory

### 4. **General User**
- Browse hospitals and blood banks
- View blood type information
- Access educational resources
- Become a donor or submit blood request

---

## 🏗️ System Architecture

### **Frontend Stack**
- **Framework:** React (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS, custom theme system
- **UI Components:** Radix UI, Material-UI
- **State Management:** React useState hooks, Context API
- **Map Integration:** Leaflet.js
- **Date/Time:** date-fns
- **HTTP Client:** Fetch API

### **Backend Stack**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **File Handling:** Multer for file uploads
- **Data Validation:** Custom validation middleware

### **Project Structure**

```
Frontend/
├── app/
│   ├── App.tsx                          # Main app component with routing
│   ├── main.tsx                         # Entry point
│   └── components/
│       ├── LandingPage.tsx              # Homepage
│       ├── Header.tsx                   # Navigation header
│       ├── LoginModal.tsx               # Authentication modal
│       ├── SignupModal.tsx              # Registration modal
│       ├── FindBlood.tsx                # Blood request entry page
│       ├── RequestForm.tsx              # Blood request form
│       ├── RequestorDashboard.tsx       # Requestor status tracking
│       ├── BecomeDonor.tsx              # Donor application form
│       ├── DonorDashboard.tsx           # Donor status & scheduling
│       ├── ScheduleDonationModal.tsx    # Schedule appointment modal
│       ├── HospitalPanel.tsx            # Hospital admin interface
│       ├── HospitalList.tsx             # Hospital directory
│       ├── Inventory.tsx                # Blood inventory display
│       ├── Education.tsx                # Educational content
│       ├── Profile.tsx                  # User profile page
│       ├── Notifications.tsx            # User notifications
│       ├── ApplicationStatus.tsx        # Status card component
│       └── Footer.tsx                   # Footer component
│   ├── services/
│       └── authAPI.ts                   # Authentication API calls
│   └── utils/
│       ├── validation.ts                # Form validation logic
│       ├── csvParser.ts                 # CSV data parsing
│       └── donationVerification.ts      # Donor verification logic
├── styles/
│   ├── index.css                        # Global styles
│   ├── theme.css                        # Theme variables
│   └── tailwind.css                     # Tailwind config
├── public/                              # Static assets
│   ├── pune_blood_banks_10.csv         # Blood bank data
│   └── pune_hospital_10.csv            # Hospital data
└── vite.config.ts                       # Vite configuration

Backend/
├── server.js                            # Express server entry
├── package.json                         # Dependencies
├── config/                              # Database configuration
├── controllers/                         # Business logic
├── models/                              # MongoDB schemas
├── routes/                              # API endpoints
│   ├── auth.js                         # Authentication routes
│   ├── donor.js                        # Donor routes
│   ├── request.js                      # Blood request routes
│   ├── hospital.js                     # Hospital routes
│   └── inventory.js                    # Inventory routes
├── middleware/                          # Express middleware
├── utils/                               # Helper utilities
├── uploads/                             # File storage
└── data/                               # Data files
```

---

## 🔄 Data Flow Diagrams

### Blood Request Flow

```
User on Find Blood Page
    ↓
Selects Hospital + Blood Type
    ↓
Click "Request This Blood"
    ↓
Opens RequestForm Modal (if not logged in → Login Modal opens)
    ↓
Form extracts user.id from logged-in user
    ↓
User fills form:
    - Patient name
    - Blood group
    - Units required
    - Prescription (required)
    - ID Proof (optional)
    ↓
Click Submit
    ↓
POST /api/request
├─ userId: "user_id" ← KEY for tracking
├─ patientName, bloodGroup, unitsRequired
├─ prescriptionFile, idProofFile
└─ hospitalId
    ↓
Backend validates & saves to MongoDB
    ↓
Success response with request ID
    ↓
Auto-redirect to Requestor Dashboard
    ↓
Dashboard polls every 3 seconds
    ↓
Hospital Staff Reviews in Hospital Panel
    ├─ Preview prescription
    ├─ Preview ID proof
    └─ Click Approve/Reject
        ↓
    ✓ Update MongoDB with new status
    ↓
Dashboard polling detects change
    ↓
Status updates in real-time (no refresh needed)
```

### Donor Application Flow

```
User clicks "Become a Donor"
    ↓
Multi-step Health Screening Form
    ├─ Step 1: Basic info (name, blood type, contact)
    ├─ Step 2: Health questions (age, weight, medical conditions)
    ├─ Step 3: Lab test results (hemoglobin, blood pressure)
    └─ Step 4: Document upload (ID, employment cert)
    ↓
Form validation & submit
    ↓
POST /api/donor/apply
├─ User identity (userId)
├─ Health screening data
├─ Verification documents (files)
└─ Blood type info
    ↓
Backend saves to MongoDB (Status: "Pending")
    ↓
Success screen shown
    ↓
Hospital staff verifies in Admin Panel
    ├─ Review health screening data
    ├─ Review documents
    └─ Approve/Reject
    ↓
GET /api/donor/application/:applicationId (by Donor)
    ↓
Donor Dashboard shows:
    ├─ If Approved: "Schedule Donation" button appears
    ├─ If Rejected: Rejection reason shown
    └─ If Pending: "Under Review" status shown
    ↓
If Approved, click "Schedule Donation"
    ↓
ScheduleDonationModal opens
    ├─ Select date (0-90 days)
    ├─ Select time (16 slots)
    └─ Confirm
    ↓
PUT /api/donor/schedule-donation/:applicationId
├─ scheduledDate: "YYYY-MM-DD"
├─ scheduledTime: "HH:MM"
└─ scheduledAt: timestamp
    ↓
Database updated
    ↓
Hospital Panel sees appointment scheduled
```

---

## 🗄️ Database Schema

### **User Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String, // "donor", "requestor", "hospital"
  verified: Boolean,
  bloodType: String, // "A+", "B-", etc.
  phone: String,
  address: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **Blood Request Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // References User
  patientName: String,
  bloodGroup: String,
  unitsRequired: Number,
  prescriptionFile: String, // File path
  idProofFile: String, // File path
  hospitalId: ObjectId, // References Hospital
  status: String, // "Pending", "Approved", "Rejected"
  rejectionReason: String, // Optional
  createdAt: Date,
  updatedAt: Date
}
```

### **Donor Application Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // References User
  bloodType: String,
  age: Number,
  weight: Number,
  medicalHistory: [String],
  hemoglobin: Number,
  bloodPressure: String,
  idDocument: String, // File path
  employmentVerification: String, // File path
  status: String, // "Pending", "Screening", "Approved", "Rejected"
  rejectionReason: String, // Optional
  createdAt: Date,
  updatedAt: Date,
  scheduledDate: String, // "YYYY-MM-DD"
  scheduledTime: String, // "HH:MM"
  scheduledAt: Date, // Timestamp
  scheduledCount: Number // How many times rescheduled
}
```

### **Hospital Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  address: String,
  city: String,
  pincode: String,
  phone: String,
  email: String,
  type: String, // "Government", "Private", "Bank"
  latitude: Number,
  longitude: Number,
  bloodInventory: {
    "O+": Number,
    "O-": Number,
    "A+": Number,
    "A-": Number,
    "B+": Number,
    "B-": Number,
    "AB+": Number,
    "AB-": Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔗 API Endpoints

### **Authentication Endpoints**

```
POST /api/auth/signup
├─ Body: { name, email, password, role, bloodType }
└─ Returns: { user, token }

POST /api/auth/login
├─ Body: { email, password }
└─ Returns: { user, token }

GET /api/auth/verify
├─ Headers: { Authorization: "Bearer TOKEN" }
└─ Returns: { user }
```

### **Blood Request Endpoints**

```
POST /api/request
├─ Body: FormData with files + { userId, patientName, bloodGroup, unitsRequired, hospitalId }
└─ Returns: { success, requestId }

GET /api/request/:requestId
├─ Params: requestId
└─ Returns: { request details }

GET /api/request/user/:userId
├─ Params: userId
└─ Returns: [ { request1 }, { request2 }, ... ]

PUT /api/request/:requestId/approve
├─ Headers: { Authorization: "Bearer TOKEN" }
└─ Returns: { request with status: "Approved" }

PUT /api/request/:requestId/reject
├─ Body: { rejectionReason }
└─ Returns: { request with status: "Rejected", rejectionReason }
```

### **Donor Endpoints**

```
POST /api/donor/apply
├─ Body: FormData with files + health screening data
└─ Returns: { success, applicationId }

GET /api/donor/application/:applicationId
├─ Params: applicationId
└─ Returns: { donor application details }

PUT /api/donor/schedule-donation/:applicationId
├─ Body: { scheduledDate, scheduledTime }
└─ Returns: { updated donor application }

GET /api/donor/approved
├─ Headers: { Authorization: "Bearer TOKEN" }
└─ Returns: [ { approved donor1 }, { approved donor2 }, ... ]
```

### **Hospital Endpoints**

```
GET /api/hospital
└─ Returns: [ { hospital1 }, { hospital2 }, ... ]

GET /api/hospital/:hospitalId
├─ Params: hospitalId
└─ Returns: { hospital details with inventory }

GET /api/hospital/pending-requests
├─ Headers: { Authorization: "Bearer TOKEN" }
└─ Returns: [ { pending request1 }, { pending request2 }, ... ]
```

### **Inventory Endpoints**

```
GET /api/inventory
└─ Returns: [ { blood bank inventory } ]

GET /api/inventory/:bloodType
├─ Params: bloodType (e.g., "A+")
└─ Returns: [ { hospitals with blood type available } ]
```

---

## 🔐 Authentication & Security

- **JWT Tokens** for stateless authentication
- **Password Hashing** using bcrypt
- **Authentication Middleware** for protected routes
- **Role-based Access Control** for hospital/admin functions
- **File Upload Validation** (size, type, virus scanning ready)

---

## 🚀 Key Implementation Details

### Real-time Status Updates
- Requestor Dashboard polls `/api/request/user/:userId` every 3 seconds
- Detects status changes from Hospital Panel
- No refresh needed - UI updates automatically
- Natural polling mechanism (600ms intervals)

### User Tracking
- Every request/application includes userId
- Logged-in user context passed through React components
- Ensures data isolation between users
- Hospital staff can only see relevant requests

### File Upload Handling
- Prescription (Blood Request) - Required
- ID Proof (Blood Request) - Optional
- ID Document (Donor Application) - Required
- Employment Verification - Required
- Multer handles file storage in `/uploads/`

### Responsive Design
- Tailwind CSS for mobile-first responsive layout
- Radix UI components for accessibility
- Material-UI icons for visual consistency
- Custom theme system for branding

---

## 📱 User Interfaces

### Patient/Requestor Flow
1. **Home Page** - Browse and search hospitals
2. **Find Blood** - Select hospital and blood type
3. **Request Form** - Fill patient details and upload documents
4. **Requestor Dashboard** - Track request status in real-time

### Donor Flow
1. **Become Donor** - Multi-step health screening application
2. **Donor Dashboard** - View application status
3. **Schedule Donation** - Pick date and time after approval
4. **Appointment Management** - View and reschedule appointments

### Hospital Flow
1. **Hospital Panel** - View all pending blood requests
2. **Document Review** - Preview prescriptions and ID proofs
3. **Request Management** - Approve/reject with reasons
4. **Donor Management** - View approved donors and schedules

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (v4.4+)
- npm or yarn

### Frontend Setup

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build
```

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file with:
# MONGODB_URI=mongodb://localhost:27017/blood-donation
# NODE_ENV=development

# Start server
node server.js
```

### Database Setup
- Create MongoDB local instance or use MongoDB Atlas
- Database name: `blood-donation`
- Collections auto-created on first insert

---

## 📊 Data Import

### Hospital Data
- CSV file: `public/pune_hospital_10.csv`
- Contains hospital details with latitude/longitude for map
- Imported during initial setup

### Blood Bank Data
- CSV file: `public/pune_blood_banks_10.csv`
- Contains blood bank inventory for location search

---

## ✅ Testing Checklist

### Blood Request Flow
- [ ] User can search and select hospital
- [ ] Request form appears after hospital selection
- [ ] Form validates required fields
- [ ] File upload works for prescription
- [ ] Request saves with userId in MongoDB
- [ ] Requestor Dashboard shows pending request
- [ ] Status updates when hospital approves

### Donor Flow
- [ ] Multi-step form completes successfully
- [ ] Documents upload properly
- [ ] Application appears in hospital panel
- [ ] Schedule button appears after approval
- [ ] Date/time selection works
- [ ] Appointment saves and displays

### Hospital Panel
- [ ] Can view pending blood requests
- [ ] Document preview works
- [ ] Can approve/reject requests
- [ ] Rejection reason saves
- [ ] Dashboard updates within 3 seconds

---

## 🔄 Typical User Journeys

### Journey 1: Patient Requests Blood
1. User lands on home page
2. Searches for nearby hospital
3. Clicks "Request Blood"
4. Logs in if needed
5. Fills request form with details
6. Uploads prescription document
7. Submits form
8. Success message shown
9. Redirected to Requestor Dashboard
10. Monitors status change as hospital reviews
11. Notification when approved/rejected

### Journey 2: Donor Registration & Scheduling
1. User navigates to "Become a Donor"
2. Completes multi-step health screening
3. Uploads required documents
4. Submits application
5. Hospital staff reviews and approves
6. Donor Dashboard shows approval
7. Donor clicks "Schedule Donation"
8. Selects convenient date and time
9. Confirms appointment
10. Hospital sees scheduled appointment
11. On donation date, shows up for donation

---

## 📝 Notes & Important Aspects

### Real-time Synchronization
- No WebSocket needed - polling approach works well for small scale
- 3-second poll interval balances responsiveness and server load
- Can be upgraded to WebSocket for larger deployments

### Data Privacy
- Users can only access their own requests/applications
- Hospital staff sees only relevant data
- No cross-user data leakage
- File uploads contain medical data - should add encryption for production

### Scalability Considerations
- Current design uses polling - suitable for <1000 concurrent users
- For larger scale, consider WebSocket for real-time updates
- MongoDB can handle thousands of documents with proper indexing
- Add caching layer (Redis) for hospital data if needed

### File Storage
- Currently stores files on local file system
- Implement file cleanup for rejected applications

---

## 🎯 Future Enhancements

1. **Push Notifications** - Notify users of status changes
2. **Email Integration** - Send confirmation emails
3. **SMS Alerts** - Text notifications for urgent requests
4. **Analytics Dashboard** - Track donation statistics
5. **Automated Matching** - AI-based blood type matching
6. **Blood Bank Sync** - Real-time inventory updates
7. **Donation History** - Track past donations
8. **Feedback System** - Rate hospital experience

---

## 📞 Support & Contact

For issues, feature requests, or questions about the system, contact the development team or refer to inline code comments and documentation files.

**Last Updated:** February 2026

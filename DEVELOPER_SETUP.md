# 🩸 HemoConnect – Developer Setup & Testing Guide

Welcome to the development guide for **HemoConnect**, a unified blood donation and emergency request management system. This document is designed to help team members set up their local environment, configure all components, run the application, and test the key user flows.

---

## 🏗️ System Architecture & Ports

HemoConnect is built as a three-tier application:

```
┌────────────────────────────────────────┐
│        Frontend (React/Vite)           │
│        Port: 5173 or 5175              │
└──────────────────┬─────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│ Node.js Backend  │  │  Python Engine   │
│ Port: 5000       │  │  Port: 8000      │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         └─────────┬───────────┘
                   ▼
       ┌───────────────────────┐
       │   Shared MongoDB      │
       │   Atlas Database      │
       └───────────────────────┘
```

1. **Frontend (Vite / React / TypeScript)**: The user interface where requestors, donors, and hospitals interact.
2. **Node.js Backend (Express / Mongoose)**: Handles authentication, user profiles, request submittals, and donor screening state.
3. **Python Priority Engine (FastAPI / Motor / asyncio)**: Manages real-time priority queues for emergency requests using a 4-factor scoring algorithm (urgency, wait time, rarity, proximity) and runs background rule escalation tasks.

---

## ⚙️ Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **Python** (v3.10 or higher recommended)
- **Git**

---

## 🚀 Step-by-Step Setup

Follow these steps to set up and run all three services locally.

### 1️⃣ Clone the Repository & Root Setup
First, clone the repository and install the frontend dependencies in the root directory:
```bash
git clone https://github.com/mdoxy/HemoConnect.git
cd HemoConnect
npm install
```

### 2️⃣ Node.js Backend Setup
Navigate to the `backend/` folder and install dependencies:
```bash
cd backend
npm install
```

### 3️⃣ Python Priority Engine Setup
Navigate to the `python_priority_engine/` folder, create a Python virtual environment, activate it, and install python dependencies:

**On Windows:**
```bash
cd python_priority_engine
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**On macOS/Linux:**
```bash
cd python_priority_engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 📝 Environment Variables Configuration

Both the Node.js backend and the Python Priority Engine require environment configuration.

### 🔴 Part A: Node.js Backend `.env`
Create a `.env` file in the `backend/` directory:
```env
# MongoDB Atlas Database URI
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/Hemoconnect?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/Hemoconnect?retryWrites=true&w=majority

# JWT Token Secret for Session Auth
JWT_SECRET=your_secret_key

# Node Server Configuration
PORT=5000
PORT_FALLBACK=true
NODE_ENV=development

# Permitted Frontend Origins (standard Vite dev server ports)
FRONTEND_URLS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5175,http://127.0.0.1:5175

# Nodemailer Email Settings (For Gmail SMTP)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 🟡 Part B: Python Priority Engine `.env`
Create a `.env` file in the `python_priority_engine/` directory:
```env
# MongoDB Connection URI (See Windows Connection note below)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/Hemoconnect?retryWrites=true&w=majority
MONGODB_DB_NAME=Hemoconnect

# Secret Key (Match the Node.js backend JWT secret to share authentication)
JWT_SECRET=your_secret_key

# Python Server Config
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000,http://127.0.0.1:5173,http://127.0.0.1:5000,http://localhost:5175,http://127.0.0.1:5175

# Escalation Configuration
ESCALATION_INTERVAL_MINUTES=15
ESCALATION_THRESHOLD_MINUTES=30
ESCALATION_BOOST=5.0
```

> [!WARNING]
> **Windows DNS/SRV Connection Issue Workaround:**
> On some Windows machines, the `pymongo` DNS resolver fails to resolve `mongodb+srv://` URLs, leading to connection timeouts.
> If you experience timeouts connecting from the Python service, change the `MONGODB_URI` in `python_priority_engine/.env` to the **direct node connection string** (available in your Atlas Connect menu under older driver versions) and append timeout parameters:
> ```env
> MONGODB_URI=mongodb://<username>:<password>@node1.mongodb.net:27017,node2.mongodb.net:27017/Hemoconnect?ssl=true&authSource=admin&replicaSet=<replicaset_name>&serverSelectionTimeoutMS=30000&tlsAllowInvalidCertificates=true
> ```

---

## ▶️ Running the Application

To test the application fully, all three services must run concurrently. Open three separate terminal windows.

### 💻 Terminal 1: React Frontend (Root Directory)
```bash
# In the root project folder
npm run dev
```
*The app will start on http://localhost:5173 or http://localhost:5175 depending on port availability.*

### 🖥️ Terminal 2: Node.js Backend
```bash
# In the backend/ folder
npm run dev
```
*The server will start on http://localhost:5000 and connect to the MongoDB Atlas cluster. If MongoDB is offline, it will run in a degraded in-memory mode for testing.*

### 🐍 Terminal 3: Python Priority Engine
```bash
# In the python_priority_engine/ folder (activate virtual env first)
# Run the database seeder ONCE to populate default priority rules:
python scripts/seed_scoring_rules.py

# Run the FastAPI server:
uvicorn main:app --reload --port 8000
```
*The FastAPI application will start on http://localhost:8000. Interactive Swagger API documentation is available at http://localhost:8000/docs.*

---

## 🧪 Detailed Testing Checklist

Follow this testing checklist to verify the full user flows of the application:

### 1️⃣ User Registration and Roles
* Navigate to the frontend page (e.g. `http://localhost:5175`).
* Register three test accounts using different roles:
  1. **Requestor Account** (Name: "Test Requestor", Role: `Requestor`)
  2. **Donor Account** (Name: "Test Donor", Role: `Donor`, Blood Type: `O-`)
  3. **Hospital Account** (Hospital Name: "City Hospital", Role: `Hospital`, Location: "Pune")

---

### 2️⃣ Blood Request Flow (Requestor User Journey)
1. **Login** as the **Requestor** account.
2. Select **"Find Blood"** from the navigation links.
3. Click on a hospital pin on the map or select from the hospital list, and click **"Request Blood"**.
4. In the Blood Request Form:
   - Fill in the **Patient Name** and **Units Required**.
   - Select the required **Blood Group** (e.g., `AB-` or `O-`).
   - Upload a sample prescription file (e.g., a PDF or image). *Note: ID Proof file is optional, but Prescription upload is compulsory.*
   - Submit the form.
5. You will be redirected to the **Requestor Dashboard** where your request will show as **"Pending"** with its unique generated ID.

---

### 3️⃣ Hospital Admin Flow (Hospital Staff Review)
1. **Login** as the **Hospital** account you selected during the blood request.
2. Go to the **Hospital Panel** (or click **"Hospital Dashboard"**).
3. Under the **Blood Requests** tab, locate the pending request.
4. Click on the request to expand it, inspect the patient details, and click **"Preview Document"** to inspect the uploaded prescription.
5. Click **"Approve"** (or **"Reject"** with a reason).
6. **Real-time Synchronization Check**: Keep both the Requestor Dashboard (logged in as Requestor in another browser/incognito window) and Hospital Panel open. When the request is approved/rejected in the Hospital Panel, the Requestor Dashboard will automatically update its status within 3 seconds without a page refresh.

---

### 4️⃣ Donor Application & Appointment Flow (Donor User Journey)
1. **Login** as the **Donor** account.
2. Click **"Become a Donor"** on the dashboard.
3. Complete the **4-step health screening** questionnaire:
   - *Step 1*: Personal Info & Blood Type.
   - *Step 2*: Health History (Age, Weight, and medical questions).
   - *Step 3*: Vital parameters (Hemoglobin levels, Blood pressure).
   - *Step 4*: Document uploads (ID Document & Employment verification).
   - Submit the application.
4. **Login** as the **Hospital** account, go to the **Hospital Panel**, click the **Donors Applications** tab, select the donor application, and click **"Approve"**.
5. Log back in as the **Donor** (or refresh the Donor Dashboard). You will see an approved status and a **"Schedule Donation"** button.
6. Click **"Schedule Donation"**, select a date (up to 90 days out), select a time slot, and click **"Confirm Appointment"**.
7. In the **Hospital Panel**, navigate to the **Donation Schedules** tab to verify that the appointment slot is logged under the hospital's view.

---

### 5️⃣ Priority Queue Testing (FastAPI Priority Engine)
1. Submit multiple blood requests to the same hospital with different blood types and urgency levels (e.g., `Critical` AB- vs `Low` O+).
2. Login as **Hospital**, go to **Hospital Panel**, and view the emergency request list.
3. Verify that requests are automatically sorted by their **Priority Score (0–100)** calculated by the Python service.
4. Access the API documentation at `http://localhost:8000/docs` to test administrative endpoints:
   - `GET /api/admin/scoring-rules` to inspect the default algorithm weights.
   - `PUT /api/admin/scoring-rules/weights` to adjust weights dynamically.

---

## 🛠️ Troubleshooting

* **MongoDB Connection Failures**: Verify your internet connection and that your local IP address is whitelisted in MongoDB Atlas under **Network Access**.
* **CORS Blocked**: If you see CORS errors in the browser console, check that `FRONTEND_URLS` in `backend/.env` and `ALLOWED_ORIGINS` in `python_priority_engine/.env` match the exact port Vite is running on.
* **Port Already in Use**: If port `5000` or `8000` is already occupied, find the PID of the process occupying the port and terminate it, or set `PORT_FALLBACK=true` in the Node.js backend `.env`.

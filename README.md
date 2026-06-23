# 🩸 HemoConnect – Blood Donation & Request Management System

## 📌 Overview

HemoConnect is a web-based platform that connects **blood donors, patients, and hospitals**.
It simplifies blood requests, donor management, and appointment scheduling in a centralized system.

---

## 🚀 Features

### 🩸 Blood Request System

* Request blood from nearby hospitals
* Upload prescription documents
* Track status: **Pending → Approved → Rejected**

### 👤 Donor Management

* Become a donor via health screening
* Upload verification documents
* Track application status

### 📅 Donation Scheduling

* Book donation appointments
* Select date & time slots
* Reschedule if needed

### 🏥 Hospital Panel

* Approve/reject blood requests
* Manage donors & appointments
* View uploaded documents

### 🗺️ Hospital Locator

* Search hospitals using map
* Filter by location & blood type

---

## 🧑‍💻 Tech Stack

### Frontend

* React (TypeScript)
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js
* MongoDB

### Other Tools

* JWT Authentication
* Multer (File Uploads)
* Leaflet.js (Maps)

---

## 📁 Project Structure

```
├── app/          # Frontend components
├── backend/      # Backend server & APIs
├── public/       # Static files
├── styles/       # CSS & Tailwind
├── index.html
├── package.json
```

---

## ⚙️ Setup Instructions

> [!IMPORTANT]
> HemoConnect is a multi-service application consisting of a React frontend, Node.js backend, and Python FastAPI priority engine.
> For full, step-by-step setup, configuration, running, and testing instructions, please refer to the comprehensive [Developer Setup & Testing Guide](DEVELOPER_SETUP.md).

For quick reference, the core setup workflow is:
1. **Frontend (Root)**: `npm install` followed by `npm run dev` (starts on port 5175 or 5173).
2. **Node.js Backend**: `cd backend && npm install` followed by `npm run dev` (starts on port 5000).
3. **Python Priority Engine**: `cd python_priority_engine`, configure venv, `pip install -r requirements.txt`, seed default rules with `python scripts/seed_scoring_rules.py`, and run `uvicorn main:app --reload --port 8000`.

---
# 🗄️ MongoDB Atlas Setup Guide

This guide helps you set up **MongoDB Atlas (Cloud Database)** for the HemoConnect project.

---

## 🌐 Step 1: Create MongoDB Atlas Account

1. Go to: https://www.mongodb.com/atlas
2. Click **Try Free**
3. Sign up using Google / Email

---

## 🏗️ Step 2: Create a Cluster

1. Click **Build a Database**
2. Choose **FREE (Shared Cluster)**
3. Select:

   * Cloud Provider: AWS (default)
   * Region: Closest to you (e.g., Mumbai)
4. Click **Create Cluster**

---

## 🔐 Step 3: Create Database User

1. Go to **Database Access**
2. Click **Add New Database User**
3. Enter:

   * Username: `admin`
   * Password: `your_password`
4. Set Role: **Read and Write to any database**
5. Click **Add User**

---

## 🌍 Step 4: Allow Network Access

1. Go to **Network Access**
2. Click **Add IP Address**
3. Select:

   * **Allow Access from Anywhere (0.0.0.0/0)**
4. Click **Confirm**

---

## 🔗 Step 5: Get Connection String

1. Go to **Database → Connect**
2. Select **Drivers**
3. Copy connection string like:

```id="mdb1"
mongodb+srv://admin:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
```

---

## ✏️ Step 6: Update for Your Project

Replace:

* `<password>` → your database password
* Add database name:

```id="mdb2"
mongodb+srv://admin:your_password@cluster0.mongodb.net/blood-donation?retryWrites=true&w=majority
```

---

## ⚙️ Step 7: Add to Backend `.env`

Create `.env` file inside `backend/`:

```id="mdb3"
MONGODB_URI=mongodb+srv://admin:your_password@cluster0.mongodb.net/blood-donation
JWT_SECRET=your_secret_key
```

---

## ▶️ Step 8: Run Backend

```bash id="mdb4"
cd backend
node server.js
```

---

## ✅ Success Check

If setup is correct:

* Server runs without error
* Database auto-creates collections
* Data gets stored in Atlas

---

## ⚠️ Important Notes

* Never upload `.env` file to GitHub
* Always keep your password secure
* Use `.env.example` for sharing config

---

## 🧠 Tip

If connection fails:

* Check password
* Check IP whitelist
* Check database name

---

🎉 Your MongoDB Atlas is now connected successfully!

---
## 🎯 Future Enhancements

* Email/SMS notifications
* Real-time updates (WebSockets)
* Analytics dashboard
* AI-based donor matching
---


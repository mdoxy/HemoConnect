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

### 1️⃣ Clone Repository

```bash
git clone https://github.com/mdoxy/HemoConnect.git
cd HemoConnect
```

### 2️⃣ Install Dependencies

```bash
npm install
cd backend
npm install
```

### 3️⃣ Setup Environment

Create `.env` file in backend:

```
MONGODB_URI=your_mongodb_url
JWT_SECRET=your_secret_key
```

### 4️⃣ Run Project

Frontend:

```bash
npm run dev
```

Backend:

```bash
cd backend
node server.js
```

---
## 🎯 Future Enhancements

* Email/SMS notifications
* Real-time updates (WebSockets)
* Analytics dashboard
* AI-based donor matching


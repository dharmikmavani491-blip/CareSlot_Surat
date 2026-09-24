# CareSlot Surat — Online Hospital Appointment Booking System
### Web Application Development (WAD) — Project-Based Learning (PBL) Activity 2
**Repository:** [https://github.com/dharmikmavani491-blip/CareSlot_Surat](https://github.com/dharmikmavani491-blip/CareSlot_Surat)

---

## 📌 Executive Overview & Purpose

**CareSlot Surat** is an end-to-end, responsive full-stack healthcare web application built for **WAD PBL Activity 2**. It provides an integrated digital OPD booking experience connecting patients with prominent accredited hospitals across **Surat, Gujarat** (including Kiran Multi Super Speciality Hospital, Sunshine Global Hospital, Apple Hospital, Surat Municipal Institute of Medical Education and Research (SMIMER), and BAPS Pramukh Swami Hospital).

The system features:
- **Professional Healthcare Green Palette:** High-end emerald green & mint palette (`#059669`, `#065f46`, `#ecfdf5`) with clean, accessible medical card components.
- **Home Page Portal with Benefits & Workflow:** Clear breakdown of platform advantages, a 4-step visual workflow, and an interactive role switcher (`[ Patient Portal ]` vs `[ Hospital Portal ]`).
- **Client-Side:** Semantic HTML5, CSS3 Grid/Flexbox responsive styling, modern Vanilla JavaScript DOM manipulation, asynchronous Fetch API, stateful hash routing, and modals.
- **Server-Side:** Node.js, Express.js REST API with clean modular routing, custom middleware (JWT auth, role-based access control, request validation, global error handling).
- **Database:** Relational SQLite with foreign keys, transactional integrity, WAL mode, and double-booking conflict prevention.
- **Real-World & Demo Data:** Publicly verified Surat hospitals, departments, and doctors combined with compliant synthetic patient demo records.
- **Auto-Seeding Database:** Self-initializing SQLite database with zero manual configuration required on local or cloud deployments.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | HTML5, CSS3, Modern JavaScript (ES6+) | Single-Page Application (SPA) architecture with pure semantic DOM manipulation |
| **Backend** | Node.js (v24+) + Express.js (v5) | Modular MVC structure (Routes, Controllers, Middleware, Models) |
| **Database** | SQLite3 (`better-sqlite3`) | Relational database with foreign keys, indexes, and ACID transactions |
| **Security** | `jsonwebtoken` (JWT), `bcryptjs` | Password hashing (salt rounds = 10) & Bearer token authorization |
| **Testing** | Native Node Fetch Test Runner + Postman | 28 automated integration tests & Postman Collection v2.1.0 |

---

## 📁 Project Structure

```
hospital-appointment-system/
├── backend/
│   ├── config/
│   │   ├── config.js               # Environment variables & constants
│   │   └── database.js             # SQLite database connection & PRAGMAs
│   ├── controllers/
│   │   ├── appointmentController.js# Appointment booking & status workflow
│   │   ├── authController.js       # Register, login, getMe
│   │   ├── departmentController.js # Department CRUD
│   │   ├── doctorController.js     # Doctor CRUD & Section 4 schedule
│   │   ├── hospitalController.js   # Hospital profiles & dashboard stats
│   │   ├── patientController.js    # Patient profile CRUD
│   │   └── slotController.js       # Time slots CRUD & availability
│   ├── database/
│   │   ├── schema.sql              # Relational database schema with foreign keys
│   │   └── seed.js                 # Automated CSV parser & database populator
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT Bearer token authentication
│   │   ├── errorMiddleware.js      # Global error & 404 handlers
│   │   ├── roleMiddleware.js       # Role authorization (Patient vs Hospital)
│   │   └── validationMiddleware.js # Input validation helpers
│   ├── models/
│   │   ├── Appointment.js          # Appointment queries & conflict checking
│   │   ├── Department.js           # Department relational model
│   │   ├── Doctor.js               # Doctor relational model
│   │   ├── Hospital.js             # Hospital relational model & stats
│   │   ├── Patient.js              # Patient demographic model
│   │   ├── Schedule.js             # Recurring OPD schedules
│   │   ├── TimeSlot.js             # Daily time slot model
│   │   └── User.js                 # Authentication credentials model
│   ├── routes/
│   │   ├── appointmentRoutes.js
│   │   ├── authRoutes.js
│   │   ├── departmentRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── hospitalRoutes.js
│   │   ├── patientRoutes.js
│   │   └── slotRoutes.js
│   ├── tests/
│   │   └── api.test.js             # 28-test automated REST API suite
│   ├── app.js                      # Express configuration & static serving
│   └── server.js                   # Application bootstrap & auto-seeder
├── data/                           # Seed Datasets (CSVs)
│   ├── appointments_demo.csv       # 32 synthetic appointment records
│   ├── departments.csv             # 24 real clinical departments
│   ├── doctor_schedules.csv        # 87 OPD schedules
│   ├── doctors.csv                 # 24 publicly verified Surat doctors
│   ├── hospitals.csv               # 5 real Surat hospitals
│   ├── patients_demo.csv           # 22 synthetic demo patients
│   ├── time_slots.csv              # Seed time slots
│   └── users_demo.csv              # Hashed demo credentials
├── frontend/
│   ├── assets/
│   │   └── logo.svg                # CareSlot vector brand mark
│   ├── css/
│   │   ├── responsive.css          # Mobile, tablet, desktop breakpoints
│   │   └── style.css               # Design system & component styles
│   ├── js/
│   │   ├── api-docs.js             # Section 14 interactive API tester
│   │   ├── api.js                  # Central fetch client & UI helpers
│   │   ├── app.js                  # Hash routing & view controller
│   │   ├── auth.js                 # Authentication & 1-click logins
│   │   ├── hospital.js             # Hospital portal & CRUD management
│   │   ├── patient.js              # 10-step wizard & appointment lists
│   │   └── schedule.js             # Section 4 doctor schedule inspector
│   └── index.html                  # Single-Page Application interface
├── postman/
│   └── Hospital_Appointment_System.postman_collection.json # Postman Suite
├── package.json
└── README.md
```

---

## 🏥 Real-World Verified Surat Hospitals

The application incorporates verified publicly available information from healthcare facilities in Surat, Gujarat:

1. **New Civil Hospital Surat (NCH Surat)** — Majura Gate, Ring Road (Government Medical College & Tertiary Teaching Hospital).
2. **Kiran Multi Super Speciality Hospital & Research Center** — Katargam, Surat (550-bed non-profit trust hospital).
3. **Shalby Multi-Specialty Hospital** — Rander Road, Adajan, Surat (NABH-accredited centre for Joint Replacement & Cardiology).
4. **Sunshine Global Hospital** — Dumas Road, Piplod, Surat (Multispecialty tertiary care centre).
5. **Mahavir Hospital & Research Centre** — Sagrampura, Ring Road, Surat (Philanthropic trust hospital).

*Disclaimer: Real publicly listed doctor names, qualifications, and specialties are used. Schedules are marked "Demo Schedule — for academic project". All patient names, phone numbers, and records are strictly synthetic demo data.*

---

## 🔑 Demo Credentials (1-Click Login Sandbox)

The top navigation bar contains 1-click login buttons for immediate testing:

| Role | Username / Email | Password | Scope / Hospital |
|---|---|---|---|
| **Patient** | `rahul.sharma@demo.com` | `patient123` | Patient Dashboard & Booking |
| **Patient** | `pooja.patel@demo.com` | `patient123` | Patient Dashboard & Booking |
| **Hospital** | `civil.admin@demo.com` | `hospital123` | New Civil Hospital Surat Admin |
| **Hospital** | `kiran.admin@demo.com` | `hospital123` | Kiran Hospital Admin |
| **Hospital** | `shalby.admin@demo.com` | `hospital123` | Shalby Hospital Admin |
| **Hospital** | `sunshine.admin@demo.com` | `hospital123` | Sunshine Global Hospital Admin |
| **Hospital** | `mahavir.admin@demo.com` | `hospital123` | Mahavir Hospital Admin |

---

## 🔄 Patient Workflow (10-Step Interactive Wizard)

The Patient Dashboard implements a guided 10-step booking flow:
1. **Step 1 — Select Hospital:** Browse verified hospitals with rating and department counts.
2. **Step 2 — Select Department:** Filter clinical specialties (Cardiology, Orthopaedics, Medicine, etc.).
3. **Step 3 — Select Doctor:** Compare doctor profiles, qualifications, experience, fees, and OPD timings.
4. **Step 4 — Select Date:** Interactive calendar date selector (disables past dates).
5. **Step 5 — Display Available Slots:** Real-time query to `/api/slots/available` for available time slots.
6. **Step 6 — Select Time Slot:** Highlights selected slot (Available = Green, Booked = Grey/Disabled).
7. **Step 7 — Enter Patient Information:** Auto-filled from patient profile with custom visit reasons and symptoms.
8. **Step 8 — Confirm Appointment:** Comprehensive summary card with doctor details, hospital address, and fee.
9. **Step 9 — Dispatch Request:** Transmits appointment request with status `Pending`.
10. **Step 10 — Display Status & Slip:** Renders appointment confirmation card with unique reference ID (`APT-YYYYMMDD-XXX`) and status badge.

### Patient Profile CRUD:
- **CREATE:** Add initial profile on registration.
- **READ:** View demographic and medical history details.
- **UPDATE:** Modify contact information, address, and allergies.
- **DELETE:** Cleanly remove synthetic demo patient account and related data.

---

## 🏥 Hospital Workflow & Section 4 Today's Schedule

### Hospital Operations:
- **Doctor CRUD:** Create new doctor, View list, Edit qualifications/fees/rooms, Delete doctor.
- **Department CRUD:** Create department, View departments, Edit descriptions, Delete department.
- **Time Slot CRUD:** Generate custom slots, toggle slot status (`AVAILABLE` ↔ `BLOCKED`), Delete slot.
- **Appointment Management:**
  - `Pending` → **Approve** (marks appointment `Approved` and slot `BOOKED`).
  - `Pending` → **Reject** (marks appointment `Rejected` and frees slot to `AVAILABLE`).
  - `Approved` → **Complete** (marks consultation `Completed`).
  - `Approved` → **Cancel** (marks `Cancelled` and frees slot to `AVAILABLE`).

### Section 4 — Today's Doctor Schedule:
Selecting any doctor and date displays the clinical schedule:
- Doctor name, Speciality, Department, Date, Total Slots, Available Slots, Booked Slots.
- Visual timeline:
  - `09:00 AM — Available`
  - `09:30 AM — Booked — Rahul Sharma (#P1)`
- Clicking any booked slot displays a modal showing synthetic patient details:
  - Patient ID (`#P1`)
  - Full Name, Age, Gender
  - Contact Number
  - Chief Visit Reason & Appointment Time
  - Status

---

## 📊 REST API Specification & CRUD Mapping

| Entity | Operation | HTTP Method | Endpoint | Description |
|---|---|---|---|---|
| **Auth** | Create | `POST` | `/api/auth/register` | Register new user & profile |
| **Auth** | Read | `POST` | `/api/auth/login` | Authenticate and obtain JWT token |
| **Auth** | Read | `GET` | `/api/auth/me` | Fetch authenticated session |
| **Hospitals** | Read | `GET` | `/api/hospitals` | List all hospitals |
| **Hospitals** | Read | `GET` | `/api/hospitals/:id` | Get single hospital details |
| **Hospitals** | Read | `GET` | `/api/hospitals/:id/stats` | Hospital dashboard counters |
| **Hospitals** | Update | `PUT` | `/api/hospitals/:id` | Update hospital contact/OPD |
| **Departments** | Read | `GET` | `/api/departments` | List departments (filter by hospital) |
| **Departments** | Create | `POST` | `/api/departments` | Add new department |
| **Departments** | Update | `PUT` | `/api/departments/:id` | Update department details |
| **Departments** | Delete | `DELETE` | `/api/departments/:id` | Remove department |
| **Doctors** | Read | `GET` | `/api/doctors` | List doctors |
| **Doctors** | Read | `GET` | `/api/doctors/:id/schedule`| **Section 4: Daily schedule & slots** |
| **Doctors** | Create | `POST` | `/api/doctors` | Add new doctor |
| **Doctors** | Update | `PUT` | `/api/doctors/:id` | Update doctor info & fees |
| **Doctors** | Delete | `DELETE` | `/api/doctors/:id` | Remove doctor |
| **Slots** | Read | `GET` | `/api/slots/available` | Get booking slots for doctor & date |
| **Slots** | Create | `POST` | `/api/slots` | Add custom time slot |
| **Slots** | Update | `PUT` | `/api/slots/:id` | Update status (Block/Unblock) |
| **Slots** | Delete | `DELETE` | `/api/slots/:id` | Remove time slot |
| **Appointments**| Read | `GET` | `/api/appointments` | List appointments (filtered) |
| **Appointments**| Create | `POST` | `/api/appointments` | Book appointment (Pending) |
| **Appointments**| Update | `PUT` | `/api/appointments/:id` | Edit appointment reason/notes |
| **Appointments**| Update | `PATCH` | `/api/appointments/:id/status`| Approve, Reject, Complete |
| **Appointments**| Update | `POST` | `/api/appointments/:id/cancel`| Cancel appointment (frees slot) |
| **Appointments**| Delete | `DELETE` | `/api/appointments/:id` | Delete appointment record |
| **Patients** | Read | `GET` | `/api/patients/me` | Logged-in patient profile |
| **Patients** | Update | `PUT` | `/api/patients/:id` | Update patient profile |
| **Patients** | Delete | `DELETE` | `/api/patients/:id` | Delete demo patient account |

---

## ⚡ Quick Start Guide (Run Locally)

### Prerequisites:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### 1. Install & Seed
The database automatically initializes and seeds all 8 CSV files upon initial startup. To seed manually:
```bash
npm run seed
```

### 2. Run the Server
```bash
npm start
```
*The Express server runs on port 5000 and serves both the REST API and the frontend application:*
- **Web Application UI:** `http://localhost:5000`
- **API Health Check:** `http://localhost:5000/api/health`
- **Interactive API Explorer:** `http://localhost:5000/#docs`

---

## 🚀 Cloud Deployment Guide

This repository is pre-configured with `render.yaml`, `Procfile`, and `Dockerfile` for seamless one-click cloud deployment.

### Option 1: Deploy on Render (Recommended Free Hosting)
1. Fork or push this repository to your GitHub account: `https://github.com/dharmikmavani491-blip/CareSlot_Surat`
2. Log in to [Render](https://render.com) and click **New + > Web Service**.
3. Connect your GitHub repository `CareSlot_Surat`.
4. Render will automatically detect the settings from `render.yaml`:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click **Create Web Service**. Your application and REST API will be live in 1-2 minutes!

### Option 2: Deploy on Railway
1. Log in to [Railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `CareSlot_Surat`. Railway will automatically build and deploy using the `Procfile` / `Dockerfile`.

### Option 3: Deploy with Docker
```bash
docker build -t careslot-surat .
docker run -p 5000:5000 careslot-surat
```

---

## 🧪 Testing & Verification

### 1. Automated Integration Test Suite
Run the 28-test automated test suite:
```bash
npm test
```
**Test Coverage:**
- API Health Check
- Patient & Hospital Login with JWT validation
- Registration of new users and profiles
- Hospitals, Doctors, and Departments CRUD
- Section 4: Doctor Schedule inspection (Available & Booked slots)
- Double-Booking Prevention check (verifying `409 Conflict` response)
- Appointment lifecycle (Pending → Approved → Cancelled)
- Patient Profile CRUD

### 2. Interactive Browser API Tester
Navigate to `http://localhost:5000/#docs` in the web application to view live endpoint documentation and execute test requests in real-time.

### 3. Postman Collection
Import the collection located at:
`postman/Hospital_Appointment_System.postman_collection.json`
Or click **"Download Postman Collection"** directly inside the web UI at `#docs`.

---

## 🎓 WAD Syllabus Coverage Matrix

| Syllabus Topic | Practical Implementation in Project |
|---|---|
| **HTML5** | Semantic tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<dialog>`, form inputs) |
| **CSS3 & Responsive Design** | CSS custom variables, Flexbox, Grid, media queries for mobile/tablet/desktop |
| **JavaScript & DOM** | Dynamic rendering, event delegation, wizard transitions, modal controls |
| **Forms & Validation** | Client-side validation, required constraints, email and phone patterns |
| **Fetch API & Asynchronous JS** | `async/await` fetch calls, Bearer token injection, error parsing |
| **JSON & Data Exchange** | Standard JSON request/response formats with HTTP status codes |
| **Node.js & Express.js** | Modular architecture (controllers, routes, middleware, models) |
| **Routing & Middleware** | Router modules, JWT authentication middleware, role-based authorization |
| **REST APIs & CRUD** | `GET`, `POST`, `PUT`, `DELETE`, and `PATCH` endpoints for all entities |
| **Database Connectivity** | SQLite3 (`better-sqlite3`) with foreign key constraints, indexes, WAL mode |
| **Error Handling & Security** | Centralized error middleware, password hashing with `bcryptjs`, 409 conflict checks |
| **API Testing** | Automated script test runner (`npm test`) and Postman collection |

---

*Academic Project developed for WAD PBL Activity 2 evaluation.*

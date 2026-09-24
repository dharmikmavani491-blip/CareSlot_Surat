-- ====================================================================
-- ONLINE HOSPITAL APPOINTMENT BOOKING SYSTEM - RELATIONAL SCHEMA
-- Database: SQLite3 with Foreign Key Enforcement
-- WAD PBL Activity 2
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('patient', 'hospital', 'admin')),
    hospital_id INTEGER REFERENCES hospitals(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. HOSPITALS TABLE
CREATE TABLE IF NOT EXISTS hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Surat',
    type TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    email TEXT NOT NULL,
    description TEXT,
    website TEXT,
    rating REAL DEFAULT 4.5,
    opd_timings TEXT DEFAULT '09:00 AM - 05:00 PM',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'activity',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    qualification TEXT NOT NULL,
    specialization TEXT NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 1,
    consultation_fee REAL NOT NULL DEFAULT 500.0,
    bio TEXT,
    opd_timing TEXT DEFAULT '09:00 AM - 01:00 PM',
    room_number TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. PATIENTS TABLE (Demo / Synthetic data only)
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    age INTEGER,
    gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
    contact TEXT NOT NULL,
    address TEXT,
    medical_history TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. DOCTOR SCHEDULES TABLE (Recurring weekly OPD schedule)
CREATE TABLE IF NOT EXISTS doctor_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon, ..., 6=Sat
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
    max_patients INTEGER NOT NULL DEFAULT 12,
    is_active INTEGER NOT NULL DEFAULT 1
);

-- 7. TIME SLOTS TABLE (Calendar slots for specific dates)
CREATE TABLE IF NOT EXISTS time_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES doctor_schedules(id) ON DELETE SET NULL,
    date TEXT NOT NULL, -- 'YYYY-MM-DD'
    start_time TEXT NOT NULL, -- '09:00 AM'
    end_time TEXT NOT NULL, -- '09:30 AM'
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'BOOKED', 'BLOCKED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(doctor_id, date, start_time)
);

-- 8. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_number TEXT UNIQUE NOT NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    date TEXT NOT NULL, -- 'YYYY-MM-DD'
    time_slot TEXT NOT NULL, -- '09:30 AM'
    slot_id INTEGER REFERENCES time_slots(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    symptoms TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed')),
    rejection_reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 9. HOSPITAL BEDS & CRITICAL CARE CAPACITY TABLE
CREATE TABLE IF NOT EXISTS hospital_beds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    bed_type TEXT NOT NULL,
    total_capacity INTEGER NOT NULL,
    occupied INTEGER NOT NULL DEFAULT 0,
    available INTEGER NOT NULL,
    ward_location TEXT,
    charge_per_day REAL DEFAULT 0.0,
    last_updated TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 10. PATIENT DIAGNOSTIC LAB REPORTS TABLE
CREATE TABLE IF NOT EXISTS lab_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
    appointment_id INTEGER REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    test_name TEXT NOT NULL,
    test_category TEXT NOT NULL,
    sample_date TEXT NOT NULL,
    report_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Completed',
    summary_findings TEXT NOT NULL,
    detailed_metrics TEXT,
    lab_technician TEXT,
    pathologist_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 11. DOCTOR REVIEWS & FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS doctor_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    wait_time_rating INTEGER CHECK(wait_time_rating BETWEEN 1 AND 5),
    comment TEXT,
    patient_display_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. SURAT REGIONAL BLOOD BANK INVENTORY TABLE
CREATE TABLE IF NOT EXISTS blood_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    blood_bank_name TEXT NOT NULL,
    blood_group TEXT NOT NULL CHECK(blood_group IN ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')),
    component_type TEXT NOT NULL DEFAULT 'Packed Red Blood Cells (PRBC)',
    units_available INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Available', 'Low Stock', 'Critical Reserve')),
    helpline_phone TEXT NOT NULL,
    last_updated TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 13. DIGITAL CLINICAL PRESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prescription_number TEXT UNIQUE NOT NULL,
    appointment_id INTEGER NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    diagnosis TEXT NOT NULL,
    symptoms_observed TEXT,
    vitals_bp TEXT DEFAULT '120/80 mmHg',
    vitals_pulse TEXT DEFAULT '72 bpm',
    vitals_temp TEXT DEFAULT '98.4 F',
    vitals_spo2 TEXT DEFAULT '98%',
    vitals_weight TEXT DEFAULT '65 kg',
    medications_json TEXT NOT NULL,
    lab_tests_recommended TEXT,
    clinical_advice TEXT,
    follow_up_date TEXT,
    doctor_registration_no TEXT NOT NULL DEFAULT 'GMC-34981',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_dept_hospital ON departments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_doctor_hosp_dept ON doctors(hospital_id, department_id);
CREATE INDEX IF NOT EXISTS idx_slots_doctor_date ON time_slots(doctor_id, date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_lookup ON appointments(doctor_id, date, time_slot);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_hospital ON appointments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_beds_hospital ON hospital_beds(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lab_patient ON lab_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_reviews_doctor ON doctor_reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_blood_group ON blood_inventory(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_hospital ON blood_inventory(hospital_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_apt ON prescriptions(appointment_id);

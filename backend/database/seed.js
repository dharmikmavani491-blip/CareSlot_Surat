const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Simple, robust CSV parser handling quoted strings and commas
function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`CSV file not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8').trim();
  if (!content) return [];

  const lines = content.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header line
  const headers = parseCSVLine(lines[0]);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

// Generate future slots dynamically based on doctor_schedules
function generateDynamicFutureSlots(doctors, schedules) {
  const insertSlot = db.prepare(`
    INSERT OR IGNORE INTO time_slots (doctor_id, schedule_id, date, start_time, end_time, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const scheduleMap = {};
  schedules.forEach(s => {
    const key = `${s.doctor_id}_${s.day_of_week}`;
    scheduleMap[key] = s;
  });

  // Generate for today and next 7 days
  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() + dayOffset);
    const dateStr = dateObj.toISOString().split('T')[0];
    const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon...

    doctors.forEach(doc => {
      const sched = scheduleMap[`${doc.id}_${dayOfWeek}`];
      if (!sched) return;

      // Create a set of 30-min slots between 9am and 1pm or 4pm
      const times = [
        ['09:00 AM', '09:30 AM'],
        ['09:30 AM', '10:00 AM'],
        ['10:00 AM', '10:30 AM'],
        ['10:30 AM', '11:00 AM'],
        ['11:00 AM', '11:30 AM'],
        ['11:30 AM', '12:00 PM'],
        ['12:00 PM', '12:30 PM'],
        ['12:30 PM', '01:00 PM']
      ];

      // If afternoon doctor, add afternoon slots
      if (sched.end_time.includes('04:00') || sched.end_time.includes('05:00')) {
        times.push(
          ['02:00 PM', '02:30 PM'],
          ['02:30 PM', '03:00 PM'],
          ['03:00 PM', '03:30 PM'],
          ['03:30 PM', '04:00 PM']
        );
      }

      times.forEach(([start, end]) => {
        insertSlot.run(doc.id, sched.id, dateStr, start, end, 'AVAILABLE');
      });
    });
  }
}

async function seed() {
  console.log('--- Starting Database Seeder for Online Hospital Appointment Booking System ---');
  const dataDir = path.join(__dirname, '../../data');

  // Disable FK temporarily for atomic clean rebuild
  db.pragma('foreign_keys = OFF');

  const runTx = db.transaction(() => {
    // Clean old tables
    db.prepare('DELETE FROM appointments').run();
    db.prepare('DELETE FROM time_slots').run();
    db.prepare('DELETE FROM doctor_schedules').run();
    db.prepare('DELETE FROM doctors').run();
    db.prepare('DELETE FROM departments').run();
    db.prepare('DELETE FROM hospitals').run();
    db.prepare('DELETE FROM patients').run();
    db.prepare('DELETE FROM users').run();

    // 1. Seed Hospitals
    console.log('Seeding hospitals from hospitals.csv...');
    const hospitals = parseCSV(path.join(dataDir, 'hospitals.csv'));
    const insertHospital = db.prepare(`
      INSERT INTO hospitals (id, name, address, city, type, contact_phone, email, description, website, rating, opd_timings, is_active)
      VALUES (@id, @name, @address, @city, @type, @contact_phone, @email, @description, @website, @rating, @opd_timings, @is_active)
    `);
    hospitals.forEach(h => insertHospital.run(h));
    console.log(`✓ Inserted ${hospitals.length} hospitals.`);

    // 2. Seed Departments
    console.log('Seeding departments from departments.csv...');
    const departments = parseCSV(path.join(dataDir, 'departments.csv'));
    const insertDept = db.prepare(`
      INSERT INTO departments (id, hospital_id, name, description, icon)
      VALUES (@id, @hospital_id, @name, @description, @icon)
    `);
    departments.forEach(d => insertDept.run(d));
    console.log(`✓ Inserted ${departments.length} departments.`);

    // 3. Seed Doctors
    console.log('Seeding doctors from doctors.csv...');
    const doctors = parseCSV(path.join(dataDir, 'doctors.csv'));
    const insertDoc = db.prepare(`
      INSERT INTO doctors (id, hospital_id, department_id, name, qualification, specialization, experience_years, consultation_fee, bio, opd_timing, room_number, is_active)
      VALUES (@id, @hospital_id, @department_id, @name, @qualification, @specialization, @experience_years, @consultation_fee, @bio, @opd_timing, @room_number, @is_active)
    `);
    doctors.forEach(d => insertDoc.run(d));
    console.log(`✓ Inserted ${doctors.length} doctors.`);

    // 4. Seed Schedules
    console.log('Seeding schedules from doctor_schedules.csv...');
    const schedules = parseCSV(path.join(dataDir, 'doctor_schedules.csv'));
    const insertSched = db.prepare(`
      INSERT INTO doctor_schedules (id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, max_patients, is_active)
      VALUES (@id, @doctor_id, @day_of_week, @start_time, @end_time, @slot_duration_minutes, @max_patients, @is_active)
    `);
    schedules.forEach(s => insertSched.run(s));
    console.log(`✓ Inserted ${schedules.length} schedules.`);

    // 5. Seed Users (with hashed passwords)
    console.log('Seeding users from users_demo.csv...');
    const users = parseCSV(path.join(dataDir, 'users_demo.csv'));
    const salt = bcrypt.genSaltSync(10);
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, email, password, role, hospital_id, created_at)
      VALUES (@id, @username, @email, @password, @role, @hospital_id, @created_at)
    `);
    users.forEach(u => {
      const hashedPassword = bcrypt.hashSync(u.password, salt);
      insertUser.run({
        id: u.id,
        username: u.username,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        hospital_id: u.hospital_id ? parseInt(u.hospital_id) : null,
        created_at: u.created_at || new Date().toISOString()
      });
    });
    console.log(`✓ Inserted ${users.length} users with hashed credentials.`);

    // 6. Seed Patients
    console.log('Seeding synthetic patients from patients_demo.csv...');
    const patients = parseCSV(path.join(dataDir, 'patients_demo.csv'));
    const insertPatient = db.prepare(`
      INSERT INTO patients (id, user_id, full_name, age, gender, contact, address, medical_history)
      VALUES (@id, @user_id, @full_name, @age, @gender, @contact, @address, @medical_history)
    `);
    patients.forEach(p => insertPatient.run(p));
    console.log(`✓ Inserted ${patients.length} synthetic patients.`);

    // 7. Seed Time Slots from CSV
    console.log('Seeding time slots from time_slots.csv...');
    const slots = parseCSV(path.join(dataDir, 'time_slots.csv'));
    const insertSlot = db.prepare(`
      INSERT INTO time_slots (id, doctor_id, schedule_id, date, start_time, end_time, status)
      VALUES (@id, @doctor_id, @schedule_id, @date, @start_time, @end_time, @status)
    `);
    slots.forEach(s => {
      insertSlot.run({
        id: s.id,
        doctor_id: s.doctor_id,
        schedule_id: s.schedule_id ? parseInt(s.schedule_id) : null,
        date: s.date,
        start_time: s.start_time,
        end_time: s.end_time,
        status: s.status || 'AVAILABLE'
      });
    });
    console.log(`✓ Inserted ${slots.length} seed time slots.`);

    // 8. Seed Appointments from CSV
    console.log('Seeding appointments from appointments_demo.csv...');
    const appointments = parseCSV(path.join(dataDir, 'appointments_demo.csv'));
    const insertApt = db.prepare(`
      INSERT INTO appointments (
        appointment_id, appointment_number, patient_id, hospital_id, doctor_id, department_id,
        date, time_slot, slot_id, reason, symptoms, notes, status, rejection_reason, created_at, updated_at
      ) VALUES (
        @appointment_id, @appointment_number, @patient_id, @hospital_id, @doctor_id, @department_id,
        @date, @time_slot, @slot_id, @reason, @symptoms, @notes, @status, @rejection_reason, @created_at, @updated_at
      )
    `);
    appointments.forEach(a => {
      insertApt.run({
        appointment_id: a.appointment_id,
        appointment_number: a.appointment_number,
        patient_id: a.patient_id,
        hospital_id: a.hospital_id,
        doctor_id: a.doctor_id,
        department_id: a.department_id,
        date: a.date,
        time_slot: a.time_slot,
        slot_id: a.slot_id ? parseInt(a.slot_id) : null,
        reason: a.reason,
        symptoms: a.symptoms || '',
        notes: a.notes || '',
        status: a.status || 'Pending',
        rejection_reason: a.rejection_reason || null,
        created_at: a.created_at || new Date().toISOString(),
        updated_at: a.updated_at || new Date().toISOString()
      });
    });
    console.log(`✓ Inserted ${appointments.length} synthetic appointments.`);

    // Dynamically generate slots for today and next 7 days for rich live interaction
    generateDynamicFutureSlots(doctors, schedules);

    // Sync time_slot status for any approved appointment
    db.prepare(`
      UPDATE time_slots 
      SET status = 'BOOKED' 
      WHERE id IN (
        SELECT slot_id FROM appointments WHERE status = 'Approved' AND slot_id IS NOT NULL
      )
    `).run();

    // 9. Seed Hospital Beds & Critical Care Capacity (Real Surat Hospitals)
    console.log('Seeding hospital bed and critical care metrics...');
    try {
      db.prepare('DELETE FROM hospital_beds').run();
    } catch(e) {}
    
    const beds = [
      // New Civil Hospital Surat (1200 beds)
      { hospital_id: 1, bed_type: 'General Ward', total_capacity: 800, occupied: 610, available: 190, ward_location: 'Ward 1 - 8, Old & New Civil Complex', charge_per_day: 0 },
      { hospital_id: 1, bed_type: 'Oxygen Supported', total_capacity: 250, occupied: 195, available: 55, ward_location: 'Swine Flu & Pulmonary Wing, Block B', charge_per_day: 0 },
      { hospital_id: 1, bed_type: 'ICU with Ventilator', total_capacity: 80, occupied: 68, available: 12, ward_location: 'Trauma Center ICU, 3rd Floor', charge_per_day: 0 },
      { hospital_id: 1, bed_type: 'Dialysis Unit', total_capacity: 40, occupied: 32, available: 8, ward_location: 'Nephrology Ward, Ground Floor', charge_per_day: 0 },
      { hospital_id: 1, bed_type: 'Emergency Trauma Bay', total_capacity: 30, occupied: 18, available: 12, ward_location: '24x7 Casualty & Triage Center', charge_per_day: 0 },

      // Kiran Multi Super Speciality Hospital (550 beds)
      { hospital_id: 2, bed_type: 'General Ward', total_capacity: 300, occupied: 240, available: 60, ward_location: 'Tower 1, Floors 4-6', charge_per_day: 1200 },
      { hospital_id: 2, bed_type: 'Oxygen Supported', total_capacity: 120, occupied: 92, available: 28, ward_location: 'Tower 2, Floor 5', charge_per_day: 2500 },
      { hospital_id: 2, bed_type: 'ICU with Ventilator', total_capacity: 60, occupied: 49, available: 11, ward_location: 'Medical & Cardiac ICU, Tower 1, 3rd Floor', charge_per_day: 6500 },
      { hospital_id: 2, bed_type: 'NICU / PICU', total_capacity: 40, occupied: 29, available: 11, ward_location: 'Paediatric Wing, Tower 2, 4th Floor', charge_per_day: 5000 },
      { hospital_id: 2, bed_type: 'Emergency Trauma Bay', total_capacity: 30, occupied: 20, available: 10, ward_location: 'Ground Floor Emergency Receiving', charge_per_day: 2000 },

      // Shalby Multi-Specialty Hospital (200 beds)
      { hospital_id: 3, bed_type: 'General Ward', total_capacity: 110, occupied: 85, available: 25, ward_location: 'Joint Replacement & Inpatient Floors 2-3', charge_per_day: 1800 },
      { hospital_id: 3, bed_type: 'Oxygen Supported', total_capacity: 40, occupied: 30, available: 10, ward_location: 'Pulmonology Wing, 4th Floor', charge_per_day: 3000 },
      { hospital_id: 3, bed_type: 'ICU with Ventilator', total_capacity: 35, occupied: 27, available: 8, ward_location: 'Critical Care Complex, 2nd Floor', charge_per_day: 7000 },
      { hospital_id: 3, bed_type: 'Emergency Trauma Bay', total_capacity: 15, occupied: 9, available: 6, ward_location: '24x7 Ambulance Bay & Casualty', charge_per_day: 2500 },

      // Sunshine Global Hospital (150 beds)
      { hospital_id: 4, bed_type: 'General Ward', total_capacity: 85, occupied: 62, available: 23, ward_location: 'Executive & Standard Wards, 2nd Floor', charge_per_day: 1500 },
      { hospital_id: 4, bed_type: 'Cardiac ICU & CCU', total_capacity: 30, occupied: 22, available: 8, ward_location: 'Coronary Care Unit, 1st Floor', charge_per_day: 7500 },
      { hospital_id: 4, bed_type: 'Oxygen Supported', total_capacity: 25, occupied: 18, available: 7, ward_location: 'High Dependency Unit (HDU)', charge_per_day: 3200 },
      { hospital_id: 4, bed_type: 'Emergency Trauma Bay', total_capacity: 10, occupied: 5, available: 5, ward_location: 'Ground Floor Emergency Room', charge_per_day: 2200 },

      // Mahavir Hospital & Research Centre (250 beds)
      { hospital_id: 5, bed_type: 'General Ward', total_capacity: 140, occupied: 112, available: 28, ward_location: 'Trust Medical Ward, 3rd Floor', charge_per_day: 800 },
      { hospital_id: 5, bed_type: 'Dialysis Unit', total_capacity: 45, occupied: 37, available: 8, ward_location: 'Smt. Kamlaben Dialysis Wing', charge_per_day: 1000 },
      { hospital_id: 5, bed_type: 'ICU with Ventilator', total_capacity: 40, occupied: 31, available: 9, ward_location: 'Multidisciplinary ICU, 2nd Floor', charge_per_day: 5500 },
      { hospital_id: 5, bed_type: 'Emergency Trauma Bay', total_capacity: 25, occupied: 16, available: 9, ward_location: 'Trauma & Emergency Center, Ground Floor', charge_per_day: 1500 }
    ];

    const insertBed = db.prepare(`
      INSERT INTO hospital_beds (hospital_id, bed_type, total_capacity, occupied, available, ward_location, charge_per_day)
      VALUES (@hospital_id, @bed_type, @total_capacity, @occupied, @available, @ward_location, @charge_per_day)
    `);
    beds.forEach(b => insertBed.run(b));
    console.log(`✓ Inserted ${beds.length} hospital bed categories.`);

    // 10. Seed Patient Diagnostic Lab Reports
    console.log('Seeding diagnostic lab reports...');
    try {
      db.prepare('DELETE FROM lab_reports').run();
    } catch(e) {}

    const reports = [
      {
        patient_id: 1,
        hospital_id: 1,
        doctor_id: 1,
        appointment_id: 1,
        test_name: 'Complete Blood Count (CBC) with Differential',
        test_category: 'Pathology',
        sample_date: '2026-09-20',
        report_date: '2026-09-21',
        status: 'Completed',
        summary_findings: 'Haemoglobin and total white blood cell counts within healthy physiological limits. Platelet count adequate. Normal peripheral smear.',
        detailed_metrics: JSON.stringify([
          { parameter: 'Haemoglobin (Hb)', result: '14.2', unit: 'g/dL', reference_range: '13.0 - 17.0', flag: 'Normal' },
          { parameter: 'Total Leukocyte Count (WBC)', result: '7,400', unit: '/mcL', reference_range: '4,000 - 11,000', flag: 'Normal' },
          { parameter: 'Platelet Count', result: '245,000', unit: '/mcL', reference_range: '150,000 - 450,000', flag: 'Normal' },
          { parameter: 'Red Blood Cell (RBC) Count', result: '4.85', unit: 'mil/mcL', reference_range: '4.5 - 5.9', flag: 'Normal' },
          { parameter: 'Packed Cell Volume (PCV)', result: '42.5', unit: '%', reference_range: '40.0 - 50.0', flag: 'Normal' },
          { parameter: 'Erythrocyte Sedimentation Rate (ESR)', result: '8', unit: 'mm/1st hr', reference_range: '0 - 15', flag: 'Normal' }
        ]),
        lab_technician: 'Ramesh K. Patel (DMLT)',
        pathologist_name: 'Dr. Sunita Rao, MD (Pathology)'
      },
      {
        patient_id: 1,
        hospital_id: 2,
        doctor_id: 7,
        appointment_id: null,
        test_name: 'Comprehensive Lipid Profile & Glycated HbA1c',
        test_category: 'Biochemistry',
        sample_date: '2026-09-18',
        report_date: '2026-09-18',
        status: 'Completed',
        summary_findings: 'Lipid parameters indicate good cardiometabolic balance. HbA1c in optimal non-diabetic range.',
        detailed_metrics: JSON.stringify([
          { parameter: 'Total Serum Cholesterol', result: '178', unit: 'mg/dL', reference_range: '< 200', flag: 'Normal' },
          { parameter: 'Triglycerides', result: '138', unit: 'mg/dL', reference_range: '< 150', flag: 'Normal' },
          { parameter: 'HDL (High Density Lipoprotein)', result: '48', unit: 'mg/dL', reference_range: '> 40', flag: 'Normal' },
          { parameter: 'LDL (Low Density Lipoprotein)', result: '102', unit: 'mg/dL', reference_range: '< 100', flag: 'Borderline' },
          { parameter: 'VLDL Cholesterol', result: '28', unit: 'mg/dL', reference_range: '< 30', flag: 'Normal' },
          { parameter: 'HbA1c (Glycated Haemoglobin)', result: '5.6', unit: '%', reference_range: '< 5.7', flag: 'Normal' }
        ]),
        lab_technician: 'Ketan M. Solanki (Chief Biochemist)',
        pathologist_name: 'Dr. Arvind Solanki, MD (Biochemistry)'
      },
      {
        patient_id: 1,
        hospital_id: 3,
        doctor_id: 15,
        appointment_id: null,
        test_name: 'Digital Chest Radiography (X-Ray PA View)',
        test_category: 'Radiology',
        sample_date: '2026-09-15',
        report_date: '2026-09-15',
        status: 'Completed',
        summary_findings: 'Both lung fields appear clear. Normal bronchovascular architecture. Cardiac size within normal limits. Sharp bilateral costophrenic angles. No active focal consolidation or pleural effusion.',
        detailed_metrics: JSON.stringify([
          { parameter: 'Lung Parenchyma', result: 'Clear & Aerated', unit: '-', reference_range: 'Normal', flag: 'Normal' },
          { parameter: 'Cardiothoracic Ratio (CTR)', result: '0.46', unit: '-', reference_range: '< 0.50', flag: 'Normal' },
          { parameter: 'Bilateral CP Angles', result: 'Sharp & Intact', unit: '-', reference_range: 'Sharp', flag: 'Normal' },
          { parameter: 'Bony Thorax & Ribs', result: 'Intact', unit: '-', reference_range: 'Normal', flag: 'Normal' }
        ]),
        lab_technician: 'Pravin R. Joshi (Radiographer)',
        pathologist_name: 'Dr. Manoj B. Desai, DMRD DNB (Consultant Radiologist)'
      }
    ];

    const insertReport = db.prepare(`
      INSERT INTO lab_reports (patient_id, hospital_id, doctor_id, appointment_id, test_name, test_category, sample_date, report_date, status, summary_findings, detailed_metrics, lab_technician, pathologist_name)
      VALUES (@patient_id, @hospital_id, @doctor_id, @appointment_id, @test_name, @test_category, @sample_date, @report_date, @status, @summary_findings, @detailed_metrics, @lab_technician, @pathologist_name)
    `);
    reports.forEach(r => insertReport.run(r));
    console.log(`✓ Inserted ${reports.length} diagnostic lab reports.`);

    // 11. Seed Doctor Reviews
    console.log('Seeding doctor reviews...');
    try {
      db.prepare('DELETE FROM doctor_reviews').run();
    } catch(e) {}

    const reviews = [
      { doctor_id: 1, patient_id: 1, appointment_id: 1, rating: 5, wait_time_rating: 5, comment: 'Dr. Ragini Verma was very attentive and patient at Civil Hospital. Explained diabetes dietary control thoroughly.', patient_display_name: 'Rahul S.' },
      { doctor_id: 7, patient_id: 1, appointment_id: null, rating: 5, wait_time_rating: 5, comment: 'Dr. Mehul Shah is an outstanding cardiologist. He clearly explained the angiogram results at Kiran Hospital.', patient_display_name: 'Priya P.' },
      { doctor_id: 13, patient_id: 1, appointment_id: null, rating: 5, wait_time_rating: 4, comment: 'Exceptional joint replacement guidance. Shalby Hospital orthopaedic staff is very courteous.', patient_display_name: 'Suresh M.' },
      { doctor_id: 17, patient_id: 1, appointment_id: null, rating: 5, wait_time_rating: 5, comment: 'Very thorough checkup at Sunshine Global Hospital. ECG and 2D Echo were reviewed with great reassurance.', patient_display_name: 'Anjali D.' },
      { doctor_id: 2, patient_id: 1, appointment_id: null, rating: 4, wait_time_rating: 4, comment: 'Good orthopaedic doctor, diagnosed hairline fracture precisely. Minor queue delay.', patient_display_name: 'Vikram B.' },
      { doctor_id: 23, patient_id: 1, appointment_id: null, rating: 5, wait_time_rating: 5, comment: 'Dr. Deepa Solanki is very gentle and compassionate. Excellent care at Mahavir Hospital.', patient_display_name: 'Meena K.' }
    ];

    const insertRev = db.prepare(`
      INSERT INTO doctor_reviews (doctor_id, patient_id, appointment_id, rating, wait_time_rating, comment, patient_display_name)
      VALUES (@doctor_id, @patient_id, @appointment_id, @rating, @wait_time_rating, @comment, @patient_display_name)
    `);
    reviews.forEach(rv => insertRev.run(rv));
    console.log(`✓ Inserted ${reviews.length} doctor reviews.`);

    // 12. Seed Blood Bank Inventory
    console.log('Seeding blood bank inventory...');
    try {
      db.prepare('DELETE FROM blood_inventory').run();
    } catch(e) {}

    const bloodItems = [
      // Civil Hospital
      { hospital_id: 1, blood_bank_name: 'New Civil Hospital Regional Blood Centre', blood_group: 'A+', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 38, status: 'Available', helpline_phone: '+91-261-2244456' },
      { hospital_id: 1, blood_bank_name: 'New Civil Hospital Regional Blood Centre', blood_group: 'A-', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 8, status: 'Low Stock', helpline_phone: '+91-261-2244456' },
      { hospital_id: 1, blood_bank_name: 'New Civil Hospital Regional Blood Centre', blood_group: 'B+', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 45, status: 'Available', helpline_phone: '+91-261-2244456' },
      { hospital_id: 1, blood_bank_name: 'New Civil Hospital Regional Blood Centre', blood_group: 'B-', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 6, status: 'Low Stock', helpline_phone: '+91-261-2244456' },
      { hospital_id: 1, blood_bank_name: 'New Civil Hospital Regional Blood Centre', blood_group: 'O+', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 52, status: 'Available', helpline_phone: '+91-261-2244456' },
      { hospital_id: 1, blood_bank_name: 'New Civil Hospital Regional Blood Centre', blood_group: 'O-', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 4, status: 'Critical Reserve', helpline_phone: '+91-261-2244456' },
      { hospital_id: 1, blood_bank_name: 'New Civil Hospital Regional Blood Centre', blood_group: 'AB+', component_type: 'Fresh Frozen Plasma (FFP)', units_available: 19, status: 'Available', helpline_phone: '+91-261-2244456' },
      { hospital_id: 1, blood_bank_name: 'New Civil Hospital Regional Blood Centre', blood_group: 'AB-', component_type: 'Platelet Concentrate (RDP)', units_available: 3, status: 'Critical Reserve', helpline_phone: '+91-261-2244456' },

      // Kiran Hospital
      { hospital_id: 2, blood_bank_name: 'Kiran Hospital Blood Centre & Transfusion Medicine', blood_group: 'A+', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 24, status: 'Available', helpline_phone: '+91-261-7161111' },
      { hospital_id: 2, blood_bank_name: 'Kiran Hospital Blood Centre & Transfusion Medicine', blood_group: 'B+', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 31, status: 'Available', helpline_phone: '+91-261-7161111' },
      { hospital_id: 2, blood_bank_name: 'Kiran Hospital Blood Centre & Transfusion Medicine', blood_group: 'O+', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 36, status: 'Available', helpline_phone: '+91-261-7161111' },
      { hospital_id: 2, blood_bank_name: 'Kiran Hospital Blood Centre & Transfusion Medicine', blood_group: 'O-', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 5, status: 'Low Stock', helpline_phone: '+91-261-7161111' },
      { hospital_id: 2, blood_bank_name: 'Kiran Hospital Blood Centre & Transfusion Medicine', blood_group: 'AB+', component_type: 'Single Donor Platelets (SDP)', units_available: 12, status: 'Available', helpline_phone: '+91-261-7161111' },

      // Shalby Hospital
      { hospital_id: 3, blood_bank_name: 'Shalby Hospital Blood Bank', blood_group: 'B+', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 18, status: 'Available', helpline_phone: '+91-261-2787777' },
      { hospital_id: 3, blood_bank_name: 'Shalby Hospital Blood Bank', blood_group: 'O+', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 22, status: 'Available', helpline_phone: '+91-261-2787777' },
      { hospital_id: 3, blood_bank_name: 'Shalby Hospital Blood Bank', blood_group: 'A+', component_type: 'Fresh Frozen Plasma (FFP)', units_available: 14, status: 'Available', helpline_phone: '+91-261-2787777' },
      { hospital_id: 3, blood_bank_name: 'Shalby Hospital Blood Bank', blood_group: 'AB-', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 2, status: 'Critical Reserve', helpline_phone: '+91-261-2787777' },

      // Sunshine Global Hospital
      { hospital_id: 4, blood_bank_name: 'Sunshine Global Hospital Blood Centre', blood_group: 'O+', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 15, status: 'Available', helpline_phone: '+91-261-4141000' },
      { hospital_id: 4, blood_bank_name: 'Sunshine Global Hospital Blood Centre', blood_group: 'A+', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 11, status: 'Available', helpline_phone: '+91-261-4141000' },
      { hospital_id: 4, blood_bank_name: 'Sunshine Global Hospital Blood Centre', blood_group: 'B+', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 16, status: 'Available', helpline_phone: '+91-261-4141000' },

      // Mahavir Hospital
      { hospital_id: 5, blood_bank_name: 'Mahavir Hospital Blood Bank & Component Lab', blood_group: 'O+', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 25, status: 'Available', helpline_phone: '+91-261-2465555' },
      { hospital_id: 5, blood_bank_name: 'Mahavir Hospital Blood Bank & Component Lab', blood_group: 'B+', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 20, status: 'Available', helpline_phone: '+91-261-2465555' },
      { hospital_id: 5, blood_bank_name: 'Mahavir Hospital Blood Bank & Component Lab', blood_group: 'O-', component_type: 'Packed Red Blood Cells (PRBC)', units_available: 3, status: 'Critical Reserve', helpline_phone: '+91-261-2465555' },
      { hospital_id: 5, blood_bank_name: 'Mahavir Hospital Blood Bank & Component Lab', blood_group: 'AB+', component_type: 'Fresh Frozen Plasma (FFP)', units_available: 10, status: 'Available', helpline_phone: '+91-261-2465555' }
    ];

    const insertBlood = db.prepare(`
      INSERT INTO blood_inventory (hospital_id, blood_bank_name, blood_group, component_type, units_available, status, helpline_phone)
      VALUES (@hospital_id, @blood_bank_name, @blood_group, @component_type, @units_available, @status, @helpline_phone)
    `);
    bloodItems.forEach(b => insertBlood.run(b));
    console.log(`✓ Inserted ${bloodItems.length} blood bank inventory records.`);

    // 13. Seed Digital Prescriptions
    console.log('Seeding clinical prescriptions...');
    try {
      db.prepare('DELETE FROM prescriptions').run();
    } catch(e) {}

    const prescriptions = [
      {
        prescription_number: 'RX-SRT-2026-001',
        appointment_id: 1,
        patient_id: 1,
        doctor_id: 1,
        hospital_id: 1,
        diagnosis: 'Acute Bronchitis with Mild Viral Pharyngitis',
        symptoms_observed: 'Dry cough for 4 days, low-grade pyrexia (99.2 F), throat irritation, clear chest auscultation',
        vitals_bp: '122/82 mmHg',
        vitals_pulse: '76 bpm',
        vitals_temp: '98.8 F',
        vitals_spo2: '98%',
        vitals_weight: '68 kg',
        medications_json: JSON.stringify([
          { medicine: 'Tab. Augmentin 625mg (Amoxycillin + Clavulanic Acid)', dosage: '1 Tablet', timing: 'Twice daily after food (1-0-1)', duration: '5 Days', notes: 'Complete full course. Do not stop midway.' },
          { medicine: 'Tab. Dolo 650mg (Paracetamol)', dosage: '1 Tablet', timing: 'As needed for fever/headache (SOS max 3 times/day)', duration: '3 Days', notes: 'Take after meals with water.' },
          { medicine: 'Syr. Ascoril LS (Levosalbutamol + Ambroxol)', dosage: '10 ml', timing: 'Three times daily after food (1-1-1)', duration: '5 Days', notes: 'Shake bottle well before use.' },
          { medicine: 'Tab. Pantocid 40mg (Pantoprazole)', dosage: '1 Tablet', timing: 'Once daily empty stomach early morning (1-0-0)', duration: '5 Days', notes: 'Take 30 mins before breakfast.' }
        ]),
        lab_tests_recommended: 'Complete Blood Count (CBC) with ESR (Already Completed - Normal), Sputum routine if cough persists > 7 days',
        clinical_advice: 'Warm saline gargles 3 times a day. Steam inhalation twice daily. Drink warm water, avoid cold and aerated beverages. Adequate rest.',
        follow_up_date: '2026-10-15',
        doctor_registration_no: 'GMC-Surat-34981'
      }
    ];

    const insertRx = db.prepare(`
      INSERT INTO prescriptions (prescription_number, appointment_id, patient_id, doctor_id, hospital_id, diagnosis, symptoms_observed, vitals_bp, vitals_pulse, vitals_temp, vitals_spo2, vitals_weight, medications_json, lab_tests_recommended, clinical_advice, follow_up_date, doctor_registration_no)
      VALUES (@prescription_number, @appointment_id, @patient_id, @doctor_id, @hospital_id, @diagnosis, @symptoms_observed, @vitals_bp, @vitals_pulse, @vitals_temp, @vitals_spo2, @vitals_weight, @medications_json, @lab_tests_recommended, @clinical_advice, @follow_up_date, @doctor_registration_no)
    `);
    prescriptions.forEach(p => insertRx.run(p));
    console.log(`✓ Inserted ${prescriptions.length} digital prescriptions.`);
  });

  runTx();
  db.pragma('foreign_keys = ON');
  console.log('--- Database Seed Completed Successfully! ---');
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed execution finished.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Seed execution error:', err);
      process.exit(1);
    });
}

module.exports = seed;

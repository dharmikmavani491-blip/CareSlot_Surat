// ====================================================================
// COMPREHENSIVE AUTOMATED REST API TEST SUITE
// WAD PBL Activity 2: Online Hospital Appointment Booking System
// Tests all CRUD operations, Auth, Role Authorization, Double-Booking
// ====================================================================

const app = require('../app');
const config = require('../config/config');
const db = require('../config/database');
const http = require('http');

let server;
let baseUrl;

let patientToken = '';
let hospitalToken = '';
let testPatientId = 1;
let testHospitalId = 1;

let createdDeptId = null;
let createdDoctorId = null;
let createdSlotId = null;
let createdAppointmentId = null;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {})
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('\n============================================================');
  console.log(' STARTING WAD PBL 2 REST API AUTOMATED TEST RUNNER');
  console.log('============================================================\n');

  // Start test server on ephemeral port
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`Test server running at ${baseUrl}\n`);

  try {
    // ----------------------------------------------------------------
    // 1. Health Check
    // ----------------------------------------------------------------
    console.log('--- 1. API Health Check ---');
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'GET /api/health returns 200 OK');

    // ----------------------------------------------------------------
    // 2. Authentication & Authorization
    // ----------------------------------------------------------------
    console.log('\n--- 2. Authentication & Authorization ---');
    // Patient Login
    const patLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'rahul.sharma@demo.com', password: 'patient123' }
    });
    assert(patLogin.status === 200 && patLogin.data.token, 'POST /api/auth/login (Patient) succeeds with JWT');
    patientToken = patLogin.data.token;

    // Hospital Login
    const hospLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'civil.admin@demo.com', password: 'hospital123' }
    });
    assert(hospLogin.status === 200 && hospLogin.data.token, 'POST /api/auth/login (Hospital Admin) succeeds with JWT');
    hospitalToken = hospLogin.data.token;

    // Auth Me
    const meRes = await request('/api/auth/me', { token: patientToken });
    assert(meRes.status === 200 && meRes.data.user.role === 'patient', 'GET /api/auth/me returns patient profile');

    // Register a new test user
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        username: `test_user_${Date.now()}`,
        email: `test_${Date.now()}@demo.com`,
        password: 'password123',
        role: 'patient',
        full_name: 'Test Automatic User',
        contact: '+91-90000-00000'
      }
    });
    assert(regRes.status === 201 && regRes.data.token, 'POST /api/auth/register creates new user & profile');

    // ----------------------------------------------------------------
    // 3. Hospitals API
    // ----------------------------------------------------------------
    console.log('\n--- 3. Hospitals API ---');
    const hospList = await request('/api/hospitals');
    assert(hospList.status === 200 && hospList.data.data.length >= 5, 'GET /api/hospitals returns >= 5 hospitals');

    const singleHosp = await request('/api/hospitals/1');
    assert(singleHosp.status === 200 && singleHosp.data.data.name.includes('Civil'), 'GET /api/hospitals/1 returns Civil Hospital');

    const statsRes = await request('/api/hospitals/1/stats');
    assert(statsRes.status === 200 && statsRes.data.data.totalDoctors > 0, 'GET /api/hospitals/1/stats returns dashboard counts');

    // ----------------------------------------------------------------
    // 4. Department CRUD
    // ----------------------------------------------------------------
    console.log('\n--- 4. Department CRUD Operations ---');
    // READ
    const deptList = await request('/api/departments?hospital_id=1');
    assert(deptList.status === 200 && deptList.data.data.length > 0, 'GET /api/departments returns department list');

    // CREATE
    const createDept = await request('/api/departments', {
      method: 'POST',
      token: hospitalToken,
      body: {
        hospital_id: 1,
        name: `Emergency Trauma Care ${Date.now()}`,
        description: '24/7 Level-1 trauma response unit',
        icon: 'shield'
      }
    });
    assert(createDept.status === 201 && createDept.data.data.id, 'POST /api/departments creates new department');
    createdDeptId = createDept.data.data.id;

    // UPDATE
    const updateDept = await request(`/api/departments/${createdDeptId}`, {
      method: 'PUT',
      token: hospitalToken,
      body: { description: 'Updated trauma center description' }
    });
    assert(updateDept.status === 200 && updateDept.data.data.description === 'Updated trauma center description', 'PUT /api/departments/:id updates department');

    // DELETE (test cleanup)
    const delDept = await request(`/api/departments/${createdDeptId}`, {
      method: 'DELETE',
      token: hospitalToken
    });
    assert(delDept.status === 200, 'DELETE /api/departments/:id deletes department');

    // ----------------------------------------------------------------
    // 5. Doctor CRUD & Today's Schedule (Section 4)
    // ----------------------------------------------------------------
    console.log('\n--- 5. Doctor CRUD & Schedule (Section 4) ---');
    // READ
    const docList = await request('/api/doctors?hospital_id=1');
    assert(docList.status === 200 && docList.data.data.length >= 5, 'GET /api/doctors returns doctors for hospital');

    // CREATE
    const createDoc = await request('/api/doctors', {
      method: 'POST',
      token: hospitalToken,
      body: {
        hospital_id: 1,
        department_id: 1,
        name: 'Dr. Test Surgeon',
        qualification: 'MS, MCh',
        specialization: 'Trauma Surgery',
        experience_years: 8,
        consultation_fee: 450,
        room_number: 'Room 501'
      }
    });
    assert(createDoc.status === 201 && createDoc.data.data.id, 'POST /api/doctors creates new doctor');
    createdDoctorId = createDoc.data.data.id;

    // UPDATE
    const updateDoc = await request(`/api/doctors/${createdDoctorId}`, {
      method: 'PUT',
      token: hospitalToken,
      body: { consultation_fee: 550 }
    });
    assert(updateDoc.status === 200 && updateDoc.data.data.consultation_fee === 550, 'PUT /api/doctors/:id updates doctor');

    // SCHEDULE (Section 4 requirement)
    const today = new Date().toISOString().split('T')[0];
    const schedRes = await request(`/api/doctors/1/schedule?date=${today}`);
    assert(
      schedRes.status === 200 &&
      schedRes.data.doctor &&
      schedRes.data.slots &&
      schedRes.data.summary.total_slots > 0,
      'GET /api/doctors/1/schedule returns doctor schedule with Available & Booked slots'
    );

    // DELETE Doctor
    const delDoc = await request(`/api/doctors/${createdDoctorId}`, {
      method: 'DELETE',
      token: hospitalToken
    });
    assert(delDoc.status === 200, 'DELETE /api/doctors/:id removes doctor');

    // ----------------------------------------------------------------
    // 6. Time Slot CRUD
    // ----------------------------------------------------------------
    console.log('\n--- 6. Time Slot CRUD Operations ---');
    const slotList = await request(`/api/slots?doctor_id=1&date=${today}`);
    assert(slotList.status === 200 && slotList.data.data.length > 0, 'GET /api/slots returns time slots');

    // CREATE custom slot
    const createSlot = await request('/api/slots', {
      method: 'POST',
      token: hospitalToken,
      body: {
        doctor_id: 1,
        date: '2026-10-15',
        start_time: '05:00 PM',
        end_time: '05:30 PM',
        status: 'AVAILABLE'
      }
    });
    assert(createSlot.status === 201 && createSlot.data.data.id, 'POST /api/slots creates custom slot');
    createdSlotId = createSlot.data.data.id;

    // UPDATE slot
    const updateSlot = await request(`/api/slots/${createdSlotId}`, {
      method: 'PUT',
      token: hospitalToken,
      body: { status: 'BLOCKED' }
    });
    assert(updateSlot.status === 200 && updateSlot.data.data.status === 'BLOCKED', 'PUT /api/slots/:id updates slot status');

    // DELETE slot
    const delSlot = await request(`/api/slots/${createdSlotId}`, {
      method: 'DELETE',
      token: hospitalToken
    });
    assert(delSlot.status === 200, 'DELETE /api/slots/:id deletes slot');

    // ----------------------------------------------------------------
    // 7. Appointment Workflow, Status Transitions & Double-Booking
    // ----------------------------------------------------------------
    console.log('\n--- 7. Appointment Workflow & Double-Booking Prevention ---');
    const bookingDate = '2026-10-20';
    const bookingTime = '10:00 AM';

    // Step 1: Create appointment
    const createApt = await request('/api/appointments', {
      method: 'POST',
      token: patientToken,
      body: {
        hospital_id: 1,
        department_id: 1,
        doctor_id: 1,
        date: bookingDate,
        time_slot: bookingTime,
        reason: 'Automated test consultation for headache',
        symptoms: 'Mild headache for 2 days'
      }
    });
    assert(createApt.status === 201 && createApt.data.data.status === 'Pending', 'POST /api/appointments creates appointment with status Pending');
    createdAppointmentId = createApt.data.data.appointment_id;

    // Step 2: Test Double-Booking Prevention (Try to book same slot again)
    const duplicateApt = await request('/api/appointments', {
      method: 'POST',
      token: patientToken,
      body: {
        hospital_id: 1,
        department_id: 1,
        doctor_id: 1,
        date: bookingDate,
        time_slot: bookingTime,
        reason: 'Second conflicting attempt for same slot'
      }
    });
    assert(duplicateApt.status === 409, 'Double booking rejected with 409 Conflict status');

    // Step 3: Hospital Approves Appointment
    const approveRes = await request(`/api/appointments/${createdAppointmentId}/status`, {
      method: 'PATCH',
      token: hospitalToken,
      body: { status: 'Approved' }
    });
    assert(approveRes.status === 200 && approveRes.data.data.status === 'Approved', 'PATCH /api/appointments/:id/status (Approved) marks appointment Approved and slot BOOKED');

    // Step 3b: Reschedule Appointment to a new slot
    const rescheduleRes = await request(`/api/appointments/${createdAppointmentId}/reschedule`, {
      method: 'POST',
      token: patientToken,
      body: {
        date: '2026-10-21',
        time_slot: '11:00 AM'
      }
    });
    assert(rescheduleRes.status === 200 && rescheduleRes.data.data.date === '2026-10-21', 'POST /api/appointments/:id/reschedule reschedules appointment to new date/time');

    // Step 4: Patient Cancels Appointment
    const cancelRes = await request(`/api/appointments/${createdAppointmentId}/cancel`, {
      method: 'POST',
      token: patientToken
    });
    assert(cancelRes.status === 200 && cancelRes.data.data.status === 'Cancelled', 'POST /api/appointments/:id/cancel cancels appointment and frees slot');

    // Step 5: Clean up test appointment
    const delApt = await request(`/api/appointments/${createdAppointmentId}`, {
      method: 'DELETE',
      token: hospitalToken
    });
    assert(delApt.status === 200, 'DELETE /api/appointments/:id removes appointment');

    // ----------------------------------------------------------------
    // 8. Patient Profile CRUD
    // ----------------------------------------------------------------
    console.log('\n--- 8. Patient Profile CRUD ---');
    const patProfile = await request('/api/patients/me', { token: patientToken });
    assert(patProfile.status === 200 && patProfile.data.data.full_name, 'GET /api/patients/me reads logged-in patient profile');

    const updateProfile = await request(`/api/patients/${patProfile.data.data.id}`, {
      method: 'PUT',
      token: patientToken,
      body: { address: 'Updated Address Adajan Surat' }
    });
    assert(updateProfile.status === 200 && updateProfile.data.data.address.includes('Updated'), 'PUT /api/patients/:id updates patient profile');

  } catch (err) {
    console.error('Fatal test error:', err);
    failedTests++;
  } finally {
    server.close();
    console.log('\n============================================================');
    console.log(` TEST SUMMARY: ${passedTests}/${totalTests} Passed | ${failedTests} Failed`);
    console.log('============================================================\n');
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runTests();

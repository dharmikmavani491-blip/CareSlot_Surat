// ====================================================================
// ONLINE HOSPITAL APPOINTMENT BOOKING SYSTEM
// Section 14: Interactive API Documentation & Browser Test Console
// ====================================================================

const ApiDocs = {
  endpoints: [
    {
      id: 'auth-login',
      category: 'Authentication',
      method: 'POST',
      path: '/api/auth/login',
      description: 'Authenticate a patient or hospital admin with email/username and password. Returns JWT token.',
      requiresAuth: false,
      sampleRequest: {
        email: "rahul.sharma@demo.com",
        password: "patient123"
      },
      sampleResponse: {
        success: true,
        message: "Login successful!",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        user: {
          id: 1,
          username: "rahul_sharma",
          email: "rahul.sharma@demo.com",
          role: "patient"
        }
      }
    },
    {
      id: 'auth-register',
      category: 'Authentication',
      method: 'POST',
      path: '/api/auth/register',
      description: 'Register a new patient or hospital account with profile details.',
      requiresAuth: false,
      sampleRequest: {
        username: "vikas_patel",
        email: "vikas.patel@demo.com",
        password: "patient123",
        role: "patient",
        full_name: "Vikas Patel",
        contact: "+91-98765-11111"
      },
      sampleResponse: {
        success: true,
        message: "Registration successful!",
        token: "eyJhbGciOiJIUzI1Ni...",
        user: { id: 29, username: "vikas_patel", role: "patient" }
      }
    },
    {
      id: 'get-hospitals',
      category: 'Hospitals',
      method: 'GET',
      path: '/api/hospitals',
      description: 'Fetch all active hospitals in Surat with ratings and statistics.',
      requiresAuth: false,
      sampleRequest: null,
      sampleResponse: {
        success: true,
        count: 5,
        data: [
          {
            id: 1,
            name: "New Civil Hospital Surat",
            address: "Majura Gate Ring Road",
            city: "Surat",
            rating: 4.5,
            total_departments: 6,
            total_doctors: 6
          }
        ]
      }
    },
    {
      id: 'get-doctors',
      category: 'Doctors (CRUD - Read)',
      method: 'GET',
      path: '/api/doctors?hospital_id=1',
      description: 'Retrieve doctors filtered by hospital and/or department.',
      requiresAuth: false,
      sampleRequest: null,
      sampleResponse: {
        success: true,
        count: 6,
        data: [
          {
            id: 1,
            name: "Dr. Ragini Verma",
            specialization: "Internal Medicine & Infectious Diseases",
            qualification: "MBBS MD (Internal Medicine)",
            consultation_fee: 300,
            opd_timing: "09:00 AM - 01:00 PM"
          }
        ]
      }
    },
    {
      id: 'doctor-schedule',
      category: 'Schedule (Section 4)',
      method: 'GET',
      path: '/api/doctors/1/schedule?date=2026-09-24',
      description: 'Retrieve detailed daily schedule for a doctor showing Available and Booked slots with demo patient details.',
      requiresAuth: false,
      sampleRequest: null,
      sampleResponse: {
        success: true,
        doctor: { id: 1, name: "Dr. Ragini Verma", specialization: "Internal Medicine" },
        summary: { total_slots: 10, available_count: 7, booked_count: 3 },
        slots: [
          { start_time: "09:00 AM", status: "BOOKED", patient_name: "Rahul Sharma", patient_id: 1 },
          { start_time: "09:30 AM", status: "AVAILABLE" }
        ]
      }
    },
    {
      id: 'post-doctor',
      category: 'Doctors (CRUD - Create)',
      method: 'POST',
      path: '/api/doctors',
      description: 'Add a new doctor to the hospital with qualifications, fees, and OPD timings.',
      requiresAuth: true,
      sampleRequest: {
        hospital_id: 1,
        department_id: 1,
        name: "Dr. Alok Verma",
        qualification: "MBBS, MD",
        specialization: "General Medicine",
        experience_years: 12,
        consultation_fee: 400,
        room_number: "Room 106",
        opd_timing: "09:00 AM - 01:00 PM"
      },
      sampleResponse: {
        success: true,
        message: "Doctor added successfully!",
        data: { id: 25, name: "Dr. Alok Verma" }
      }
    },
    {
      id: 'get-slots',
      category: 'Time Slots (CRUD - Read)',
      method: 'GET',
      path: '/api/slots/available?doctor_id=1&date=2026-09-24',
      description: 'Get available time slots for patient booking (Step 5/6).',
      requiresAuth: false,
      sampleRequest: null,
      sampleResponse: {
        success: true,
        count: 10,
        data: [
          { slot_id: 1, start_time: "09:00 AM", status: "BOOKED" },
          { slot_id: 3, start_time: "10:00 AM", status: "AVAILABLE" }
        ]
      }
    },
    {
      id: 'create-appointment',
      category: 'Appointments (CRUD - Create)',
      method: 'POST',
      path: '/api/appointments',
      description: 'Patient submits appointment booking request. Performs double-booking validation and sets status to Pending.',
      requiresAuth: false,
      sampleRequest: {
        patient_id: 1,
        hospital_id: 1,
        department_id: 1,
        doctor_id: 1,
        date: "2026-10-05",
        time_slot: "11:00 AM",
        reason: "Recurrent headache and dizziness",
        symptoms: "Throbbing pain in forehead for 3 days"
      },
      sampleResponse: {
        success: true,
        message: "Appointment request submitted successfully! Current status: Pending approval.",
        data: {
          appointment_id: 33,
          appointment_number: "APT-20261005-001",
          status: "Pending"
        }
      }
    },
    {
      id: 'patch-appointment-status',
      category: 'Appointments (Workflow)',
      method: 'PATCH',
      path: '/api/appointments/1/status',
      description: 'Hospital approves, rejects, cancels, or completes an appointment request. Synchronizes time slot BOOKED / AVAILABLE.',
      requiresAuth: false,
      sampleRequest: {
        status: "Approved"
      },
      sampleResponse: {
        success: true,
        message: "Appointment approved! The time slot has been marked as BOOKED.",
        data: { appointment_id: 1, status: "Approved" }
      }
    },
    {
      id: 'patient-profile',
      category: 'Patient Profile (CRUD)',
      method: 'GET',
      path: '/api/patients/me',
      description: 'Fetch the authenticated patient profile details.',
      requiresAuth: true,
      sampleRequest: null,
      sampleResponse: {
        success: true,
        data: {
          id: 1,
          full_name: "Rahul Sharma",
          age: 34,
          gender: "Male",
          contact: "+91-98250-12345",
          address: "Flat 402 Shivalik Residency Adajan Surat"
        }
      }
    }
  ],

  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('api-docs-container');
    if (!container) return;

    container.innerHTML = this.endpoints.map(ep => `
      <div class="api-doc-item" id="doc-${ep.id}">
        <div class="api-doc-header" onclick="ApiDocs.toggleItem('${ep.id}')">
          <div class="api-endpoint">
            <span class="method-tag method-${ep.method.toLowerCase()}">${ep.method}</span>
            <span style="font-weight: 700;">${escapeHtml(ep.path)}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 0.8rem; color: var(--text-muted);">${ep.category}</span>
            <span style="font-size: 0.9rem;">▼</span>
          </div>
        </div>

        <div class="api-doc-body">
          <p style="margin-bottom: 1rem; font-size: 0.9rem;">${escapeHtml(ep.description)}</p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
            <div>
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.35rem;">SAMPLE REQUEST BODY (JSON)</div>
              <pre class="code-block">${ep.sampleRequest ? escapeHtml(JSON.stringify(ep.sampleRequest, null, 2)) : '// No request body required for GET'}</pre>
            </div>
            <div>
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.35rem;">SAMPLE RESPONSE (200 / 201 JSON)</div>
              <pre class="code-block">${escapeHtml(JSON.stringify(ep.sampleResponse, null, 2))}</pre>
            </div>
          </div>

          <div style="background: var(--bg-muted); padding: 1rem; border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <strong>Live Test Console</strong>
              <button class="btn btn-primary btn-sm" onclick="ApiDocs.executeTest('${ep.id}')">▶ Run in Browser</button>
            </div>
            <div id="output-${ep.id}" style="display: none; margin-top: 0.5rem;">
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">RESPONSE:</div>
              <pre class="code-block" id="pre-${ep.id}"></pre>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  toggleItem(id) {
    const el = document.getElementById(`doc-${id}`);
    if (el) el.classList.toggle('open');
  },

  async executeTest(id) {
    const ep = this.endpoints.find(e => e.id === id);
    if (!ep) return;

    const outputContainer = document.getElementById(`output-${id}`);
    const preEl = document.getElementById(`pre-${id}`);
    if (!outputContainer || !preEl) return;

    outputContainer.style.display = 'block';
    preEl.textContent = 'Executing HTTP request...';

    try {
      const startTime = performance.now();
      const res = await API.request(ep.path.replace('/api', ''), {
        method: ep.method,
        body: ep.sampleRequest
      });
      const duration = (performance.now() - startTime).toFixed(1);

      preEl.textContent = `HTTP Status: 200 OK (${duration}ms)\n\n` + JSON.stringify(res, null, 2);
    } catch (err) {
      preEl.textContent = `HTTP Status: ${err.status || 500} Error\n\n` + JSON.stringify(err.data || { error: err.message }, null, 2);
    }
  }
};

window.ApiDocs = ApiDocs;

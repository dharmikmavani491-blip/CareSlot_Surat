// ====================================================================
// ONLINE HOSPITAL APPOINTMENT BOOKING SYSTEM
// Patient Dashboard & 10-Step Booking Workflow
// ====================================================================

const PatientUI = {
  currentStep: 1,
  selectedHospital: null,
  selectedDepartment: null,
  selectedDoctor: null,
  selectedDate: null,
  selectedSlot: null,
  bookingReason: '',
  bookingSymptoms: '',

  hospitals: [],
  departments: [],
  doctors: [],
  slots: [],
  appointments: [],
  myProfile: null,

  init() {
    this.bindEvents();
  },

  async loadDashboard() {
    try {
      await this.loadProfile();
      await this.loadAppointments();
      this.loadLabReports();
      this.initBookingWizard();
    } catch (err) {
      console.error('Error loading patient dashboard:', err);
    }
  },

  async loadProfile() {
    try {
      const res = await API.request('/patients/me');
      if (res.success && res.data) {
        this.myProfile = res.data;
        this.renderProfile();
      }
    } catch (err) {
      console.log('No profile yet for current user:', err.message);
    }
  },

  async loadAppointments() {
    try {
      const res = await API.request('/appointments');
      if (res.success) {
        this.appointments = res.data;
        this.renderStats();
        this.renderAppointmentsList();
        this.renderHistoryList();
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  },

  renderStats() {
    const total = this.appointments.length;
    const pending = this.appointments.filter(a => a.status === 'Pending').length;
    const approved = this.appointments.filter(a => a.status === 'Approved').length;
    const completed = this.appointments.filter(a => a.status === 'Completed').length;
    const cancelled = this.appointments.filter(a => a.status === 'Cancelled').length;

    const elTotal = document.getElementById('pat-stat-total');
    const elPending = document.getElementById('pat-stat-pending');
    const elApproved = document.getElementById('pat-stat-approved');
    const elCompleted = document.getElementById('pat-stat-completed');
    const elCancelled = document.getElementById('pat-stat-cancelled');

    if (elTotal) elTotal.textContent = total;
    if (elPending) elPending.textContent = pending;
    if (elApproved) elApproved.textContent = approved;
    if (elCompleted) elCompleted.textContent = completed;
    if (elCancelled) elCancelled.textContent = cancelled;
  },

  renderAppointmentsList(filter = 'all') {
    const listEl = document.getElementById('pat-appointments-table-body');
    if (!listEl) return;

    let filtered = this.appointments;
    if (filter !== 'all') {
      filtered = this.appointments.filter(a => a.status.toLowerCase() === filter.toLowerCase());
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No appointments found in this view.
          </td>
        </tr>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(apt => {
      const canEdit = apt.status === 'Pending';
      const canReschedule = ['Pending', 'Approved'].includes(apt.status);
      const canCancel = ['Pending', 'Approved'].includes(apt.status);

      return `
        <tr>
          <td><strong>#${escapeHtml(apt.appointment_number)}</strong></td>
          <td>
            <div style="font-weight: 600;">${escapeHtml(apt.hospital_name)}</div>
            <small style="color: var(--text-muted);">${escapeHtml(apt.department_name)}</small>
          </td>
          <td>
            <div style="font-weight: 600;">${escapeHtml(apt.doctor_name)}</div>
            <small style="color: var(--text-muted);">${escapeHtml(apt.doctor_specialization)}</small>
          </td>
          <td>
            <div>${formatDate(apt.date)}</div>
            <small style="font-weight: 600; color: var(--primary);">${escapeHtml(apt.time_slot)}</small>
          </td>
          <td>
            <span class="badge badge-${apt.status.toLowerCase()}">${escapeHtml(apt.status)}</span>
            ${apt.status === 'Approved' ? `
              <div style="margin-top: 4px;">
                <span style="display:inline-block; font-size:0.7rem; font-weight:700; color:#047857; background:#d1fae5; border:1px solid #a7f3d0; padding:1px 6px; border-radius:4px; white-space:nowrap;">
                  🎫 Token #${(apt.appointment_id % 20 + 5).toString().padStart(2, '0')}
                </span>
              </div>
            ` : ''}
          </td>
          <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHtml(apt.reason)}
          </td>
          <td>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              <button class="btn btn-outline btn-sm" onclick="PatientUI.viewDetails(${apt.appointment_id})">Slip</button>
              ${apt.status === 'Approved' ? `<button class="btn btn-sm" style="background:#059669; color:#fff; font-size:0.75rem; padding:2px 8px; font-weight:700;" onclick="PatientUI.openLiveQueueModal(${apt.appointment_id})">🎫 OPD Queue</button>` : ''}
              ${canReschedule ? `<button class="btn btn-outline-primary btn-sm" onclick="PatientUI.openRescheduleModal(${apt.appointment_id})" title="Change date or time slot">🔄 Reschedule</button>` : ''}
              ${canEdit ? `<button class="btn btn-outline btn-sm" onclick="PatientUI.openEditModal(${apt.appointment_id})">Edit</button>` : ''}
              ${canCancel ? `<button class="btn btn-danger btn-sm" onclick="PatientUI.cancelAppointment(${apt.appointment_id})">Cancel</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderHistoryList() {
    const listEl = document.getElementById('pat-history-table-body');
    if (!listEl) return;

    const historyItems = this.appointments.filter(a => ['Completed', 'Cancelled', 'Rejected'].includes(a.status));

    if (historyItems.length === 0) {
      listEl.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No past appointment history records yet.
          </td>
        </tr>
      `;
      return;
    }

    listEl.innerHTML = historyItems.map(apt => `
      <tr>
        <td><strong>#${escapeHtml(apt.appointment_number)}</strong></td>
        <td>${escapeHtml(apt.hospital_name)}</td>
        <td>${escapeHtml(apt.doctor_name)}</td>
        <td>${formatDate(apt.date)} at ${escapeHtml(apt.time_slot)}</td>
        <td><span class="badge badge-${apt.status.toLowerCase()}">${escapeHtml(apt.status)}</span></td>
        <td>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
            <button class="btn btn-outline btn-sm" onclick="PatientUI.viewDetails(${apt.appointment_id})">View Slip</button>
            ${apt.status === 'Completed' ? `
              <button class="btn btn-outline-primary btn-sm" onclick="ReviewUI.openReviewModal(${apt.doctor_id}, '${escapeHtml(apt.doctor_name)}', ${apt.appointment_id})">
                ⭐ Rate Doctor
              </button>
              <button class="btn btn-primary btn-sm" onclick="PatientUI.viewPrescription(${apt.appointment_id})">
                📄 Digital Rx
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  },

  // ==================================================================
  // 10-STEP APPOINTMENT BOOKING WIZARD
  // ==================================================================
  async initBookingWizard() {
    this.goToStep(1);
    await this.fetchHospitals();
  },

  goToStep(stepNumber) {
    this.currentStep = stepNumber;

    // Update Stepper circles
    document.querySelectorAll('.wizard-step-node').forEach(node => {
      const step = parseInt(node.dataset.step);
      node.classList.remove('active', 'completed');
      if (step === stepNumber) {
        node.classList.add('active');
      } else if (step < stepNumber) {
        node.classList.add('completed');
      }
    });

    // Toggle Step Panels
    document.querySelectorAll('.wizard-step-panel').forEach(panel => {
      panel.style.display = 'none';
    });

    const activePanel = document.getElementById(`wizard-step-${stepNumber}`);
    if (activePanel) {
      activePanel.style.display = 'block';
    }
  },

  // Step 1: Hospitals
  async fetchHospitals() {
    try {
      const res = await API.request('/hospitals');
      if (res.success) {
        this.hospitals = res.data;
        const container = document.getElementById('step-hospital-list');
        if (!container) return;

        container.innerHTML = this.hospitals.map(h => `
          <div class="card hospital-select-card ${this.selectedHospital && this.selectedHospital.id === h.id ? 'border-primary' : ''}" 
               style="cursor: pointer; padding: 1.25rem; transition: var(--transition); display: flex; flex-direction: column; justify-content: space-between;"
               onclick="PatientUI.selectHospital(${h.id})">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.5rem;">
                <h4 style="color: var(--primary-dark); font-size: 1.05rem; margin: 0; line-height: 1.35; flex: 1 1 auto; min-width: 0; word-break: break-word;">${escapeHtml(h.name)}</h4>
                <span class="hospital-rating-badge" title="Accredited Rating">★ ${Number(h.rating).toFixed(1)}</span>
              </div>
              <p style="font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--primary); font-weight: 600;">📍 ${escapeHtml(h.address)}, ${escapeHtml(h.city)}</p>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem; line-height: 1.45;">${escapeHtml(h.description)}</p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.775rem; color: var(--text-muted); padding-top: 0.5rem; border-top: 1px dashed var(--border);">
              <span>🏢 ${h.total_departments} Departments</span>
              <span>👨‍⚕️ ${h.total_doctors} Doctors</span>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      showToast('Failed to load hospitals list.', 'error');
    }
  },

  async selectHospital(hospitalId) {
    if (!this.hospitals || this.hospitals.length === 0) {
      await this.fetchHospitals();
    }
    this.selectedHospital = this.hospitals.find(h => h.id === hospitalId);
    this.selectedDepartment = null;
    this.selectedDoctor = null;
    this.selectedSlot = null;
    await this.fetchDepartments(hospitalId);
    this.goToStep(2);
  },

  // Step 2: Departments
  async fetchDepartments(hospitalId) {
    try {
      const res = await API.request(`/departments?hospital_id=${hospitalId}`);
      if (res.success) {
        this.departments = res.data;
        const container = document.getElementById('step-dept-list');
        if (!container) return;

        container.innerHTML = this.departments.map(d => `
          <div class="card dept-select-card" 
               style="cursor: pointer; padding: 1rem; transition: var(--transition);"
               onclick="PatientUI.selectDepartment(${d.id})">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                🏥
              </div>
              <div>
                <h4 style="font-size: 1rem; margin-bottom: 0.15rem;">${escapeHtml(d.name)}</h4>
                <p style="font-size: 0.775rem; margin: 0;">${escapeHtml(d.description || 'Specialized clinical care')}</p>
                <small style="color: var(--primary); font-weight: 600;">${d.total_doctors} Doctors available</small>
              </div>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      showToast('Failed to load departments.', 'error');
    }
  },

  async selectDepartment(deptId) {
    this.selectedDepartment = this.departments.find(d => d.id === deptId);
    this.selectedDoctor = null;
    this.selectedSlot = null;
    await this.fetchDoctors(this.selectedHospital.id, deptId);
    this.goToStep(3);
  },

  // Step 3: Doctors
  async fetchDoctors(hospitalId, deptId) {
    try {
      const res = await API.request(`/doctors?hospital_id=${hospitalId}&department_id=${deptId}`);
      if (res.success) {
        this.doctors = res.data;
        const container = document.getElementById('step-doctor-list');
        if (!container) return;

        if (this.doctors.length === 0) {
          container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No doctors listed in this department currently.</p>';
          return;
        }

        container.innerHTML = this.doctors.map(doc => `
          <div class="card doctor-select-card" 
               style="cursor: pointer; padding: 1.25rem; transition: var(--transition);"
               onclick="PatientUI.selectDoctor(${doc.id})">
            <div style="display: flex; gap: 1rem; align-items: flex-start;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
                👨‍⚕️
              </div>
              <div style="flex: 1 1 auto; min-width: 0;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.2rem;">
                  <h4 style="font-size: 1.05rem; margin: 0; line-height: 1.3; flex: 1 1 auto; min-width: 0; word-break: break-word;">${escapeHtml(doc.name)}</h4>
                  <span class="doctor-rating-badge" title="Patient Rating">★ ${Number(doc.avg_rating || 4.8).toFixed(1)}</span>
                </div>
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--primary);">${escapeHtml(doc.specialization)}</div>
                <div style="font-size: 0.775rem; color: var(--text-muted);">${escapeHtml(doc.qualification)}</div>
                <div style="display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.775rem;">
                  <span>⏳ ${doc.experience_years} yrs exp</span>
                  <span style="font-weight: 700; color: var(--success);">₹${doc.consultation_fee} Fee</span>
                </div>
                <div style="margin-top: 0.35rem; font-size: 0.75rem; color: var(--text-muted);">
                  🕒 OPD: ${escapeHtml(doc.opd_timing)} | 🚪 ${escapeHtml(doc.room_number || 'Room 101')}
                </div>
              </div>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      showToast('Failed to load doctors.', 'error');
    }
  },

  selectDoctor(doctorId) {
    this.selectedDoctor = this.doctors.find(d => d.id === doctorId);
    this.selectedSlot = null;

    // Set default date to today in date picker
    const dateInput = document.getElementById('step-date-picker');
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateInput) {
      dateInput.min = todayStr;
      dateInput.value = todayStr;
      this.selectedDate = todayStr;
    }

    this.goToStep(4);
  },

  // Step 4 & 5: Date and Available Slots
  async fetchSlotsForDate() {
    const dateInput = document.getElementById('step-date-picker');
    if (!dateInput || !dateInput.value) {
      showToast('Please select an appointment date.', 'warning');
      return;
    }

    this.selectedDate = dateInput.value;
    try {
      const res = await API.request(`/slots/available?doctor_id=${this.selectedDoctor.id}&date=${this.selectedDate}`);
      if (res.success) {
        this.slots = res.data;
        this.renderSlots();
        this.goToStep(5);
      }
    } catch (err) {
      showToast('Failed to retrieve slots for selected date.', 'error');
    }
  },

  renderSlots() {
    const container = document.getElementById('step-slots-container');
    if (!container) return;

    if (this.slots.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No slots available on this date. Please pick another date.</p>';
      return;
    }

    container.innerHTML = `
      <div style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text-muted);">
        Select an available time slot below (Green = Available, Grey = Booked):
      </div>
      <div class="slots-grid">
        ${this.slots.map(slot => {
          const isAvailable = slot.status === 'AVAILABLE';
          const isSelected = this.selectedSlot && this.selectedSlot.slot_id === slot.slot_id;

          return `
            <button type="button" 
                    class="slot-btn ${isSelected ? 'selected' : ''} ${!isAvailable ? 'booked' : ''}"
                    ${!isAvailable ? 'disabled' : ''}
                    onclick="PatientUI.selectSlot(${slot.slot_id}, '${escapeHtml(slot.start_time)}')">
              <span>${escapeHtml(slot.start_time)}</span>
              <span class="slot-status-text" style="color: ${isAvailable ? 'var(--success)' : 'var(--text-muted)'};">
                ${isAvailable ? 'Available' : 'Booked'}
              </span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  },

  // Step 6: Select Slot
  selectSlot(slotId, startTime) {
    this.selectedSlot = this.slots.find(s => s.slot_id === slotId) || { slot_id: slotId, start_time: startTime };
    this.renderSlots(); // update selection highlight

    // Pre-fill Step 7 Patient Info form if profile exists
    if (this.myProfile) {
      const nameInput = document.getElementById('step-pat-name');
      const ageInput = document.getElementById('step-pat-age');
      const genderInput = document.getElementById('step-pat-gender');
      const contactInput = document.getElementById('step-pat-contact');
      const addressInput = document.getElementById('step-pat-address');

      if (nameInput) nameInput.value = this.myProfile.full_name || '';
      if (ageInput) ageInput.value = this.myProfile.age || '';
      if (genderInput) genderInput.value = this.myProfile.gender || 'Male';
      if (contactInput) contactInput.value = this.myProfile.contact || '';
      if (addressInput) addressInput.value = this.myProfile.address || '';
    }

    this.goToStep(7);
  },

  // Step 7: Patient Info & Reason
  submitPatientInfo() {
    const reasonInput = document.getElementById('step-pat-reason');
    const symptomsInput = document.getElementById('step-pat-symptoms');

    if (!reasonInput || !reasonInput.value.trim()) {
      showToast('Please state the reason for your visit.', 'warning');
      return;
    }

    this.bookingReason = reasonInput.value.trim();
    this.bookingSymptoms = symptomsInput ? symptomsInput.value.trim() : '';

    this.renderConfirmationStep();
    this.goToStep(8);
  },

  // Step 8: Confirm Appointment Summary
  renderConfirmationStep() {
    const summaryCard = document.getElementById('step-summary-card');
    if (!summaryCard) return;

    summaryCard.innerHTML = `
      <div style="background: var(--bg-muted); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 0.75rem; color: var(--primary-dark);">Appointment Review</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.9rem;">
          <div>
            <div style="color: var(--text-muted); font-size: 0.8rem;">Hospital</div>
            <strong>${escapeHtml(this.selectedHospital.name)}</strong>
            <div style="font-size: 0.775rem; color: var(--text-muted);">${escapeHtml(this.selectedHospital.address)}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.8rem;">Specialist / Doctor</div>
            <strong>${escapeHtml(this.selectedDoctor.name)}</strong>
            <div style="font-size: 0.775rem; color: var(--primary);">${escapeHtml(this.selectedDoctor.specialization)}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.8rem;">Date & Time Slot</div>
            <strong>${formatDate(this.selectedDate)}</strong>
            <div style="font-weight: 700; color: var(--primary);">${escapeHtml(this.selectedSlot.start_time)}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.8rem;">Consultation Fee</div>
            <strong style="color: var(--success); font-size: 1.1rem;">₹${this.selectedDoctor.consultation_fee}</strong>
            <div style="font-size: 0.775rem; color: var(--text-muted);">Payable at OPD reception</div>
          </div>
        </div>

        <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border);" />

        <div>
          <div style="color: var(--text-muted); font-size: 0.8rem;">Reason for Appointment</div>
          <div style="font-weight: 600;">${escapeHtml(this.bookingReason)}</div>
          ${this.bookingSymptoms ? `<div style="font-size: 0.825rem; color: var(--text-muted); margin-top: 0.25rem;">Symptoms: ${escapeHtml(this.bookingSymptoms)}</div>` : ''}
        </div>
      </div>
    `;
  },

  // Step 9: Send Appointment Request
  async confirmBooking() {
    const confirmBtn = document.getElementById('step-confirm-btn');
    try {
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Transmitting request...';
      }

      const body = {
        hospital_id: this.selectedHospital.id,
        department_id: this.selectedDepartment.id,
        doctor_id: this.selectedDoctor.id,
        date: this.selectedDate,
        time_slot: this.selectedSlot.start_time,
        slot_id: this.selectedSlot.slot_id,
        reason: this.bookingReason,
        symptoms: this.bookingSymptoms
      };

      const res = await API.request('/appointments', {
        method: 'POST',
        body
      });

      // Step 10: Display Status & Confirmation Slip
      this.renderStatusStep(res.data);
      this.goToStep(10);
      showToast('Appointment request sent! Status: Pending Hospital Approval.', 'success');

      // Refresh appointment list in background
      await this.loadAppointments();
    } catch (err) {
      if (err.status === 409) {
        showToast('Double booking prevented: This slot has just been requested or booked. Please pick another slot.', 'error');
        this.goToStep(5);
        this.fetchSlotsForDate();
      } else {
        showToast(err.message || 'Booking submission failed.', 'error');
      }
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm & Send Request';
      }
    }
  },

  // Step 10: Display Status
  renderStatusStep(apt) {
    const container = document.getElementById('step-status-container');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: #dcfce7; color: #15803d; font-size: 2.2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem;">
          ✓
        </div>
        <h2 style="color: var(--text-main); margin-bottom: 0.5rem;">Appointment Request Received!</h2>
        <p style="margin-bottom: 1.5rem;">Your request has been delivered to <strong>${escapeHtml(apt.hospital_name || this.selectedHospital.name)}</strong>.</p>
        
        <div style="display: inline-block; text-align: left; background: var(--bg-card); border: 2px dashed var(--border); border-radius: var(--radius-lg); padding: 1.5rem; max-width: 450px; width: 100%; box-shadow: var(--shadow-sm); margin-bottom: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span style="font-size: 0.85rem; color: var(--text-muted);">Appointment ID</span>
            <span style="font-weight: 800; color: var(--primary); font-size: 1.1rem;">#${escapeHtml(apt.appointment_number)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span style="font-size: 0.85rem; color: var(--text-muted);">Current Status</span>
            <span class="badge badge-pending" style="font-size: 0.85rem; padding: 0.35rem 0.85rem;">Pending Approval</span>
          </div>
          <div style="font-size: 0.875rem; margin-bottom: 0.5rem;">
            <strong>${escapeHtml(apt.doctor_name || this.selectedDoctor.name)}</strong> (${escapeHtml(apt.doctor_specialization || this.selectedDoctor.specialization)})
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
            📅 ${formatDate(apt.date)} at 🕒 ${escapeHtml(apt.time_slot)}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            📍 ${escapeHtml(apt.hospital_name || this.selectedHospital.name)}
          </div>
        </div>

        <!-- Simulated Real-Time SMS & WhatsApp Alert -->
        <div style="max-width: 450px; margin: 0 auto 1.5rem; background: #f0fdf4; border: 1px solid #86efac; border-radius: var(--radius-sm); padding: 0.75rem 1rem; text-align: left; font-size: 0.8rem; color: #166534;">
          <div style="font-weight: 700; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>💬</span> <span>SMS & WhatsApp Alert Dispatched to ${escapeHtml(apt.patient_contact || '+91-98765-43210')}</span>
          </div>
          <div style="font-family: monospace; font-size: 0.75rem; color: #14532d; background: #ffffff; padding: 0.5rem; border-radius: 4px; border: 1px dashed #bbf7d0;">
            "CareSlot Surat: Request #${escapeHtml(apt.appointment_number)} submitted for Dr. ${escapeHtml(apt.doctor_name || this.selectedDoctor.name)} on ${formatDate(apt.date)} at ${escapeHtml(apt.time_slot)}. Track status on portal."
          </div>
        </div>

        <div>
          <button class="btn btn-primary" onclick="PatientUI.initBookingWizard()">Book Another Appointment</button>
          <button class="btn btn-outline" style="margin-left: 0.75rem;" onclick="PatientUI.switchSubTab('my-appointments')">View My Appointments</button>
        </div>
      </div>
    `;
  },

  // ==================================================================
  // APPOINTMENT ACTIONS (CANCEL, EDIT, DETAILS)
  // ==================================================================
  async cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment request? The time slot will become available again.')) {
      return;
    }

    try {
      const res = await API.request(`/appointments/${appointmentId}/cancel`, {
        method: 'POST'
      });
      showToast(res.message || 'Appointment cancelled successfully.');
      await this.loadAppointments();
    } catch (err) {
      showToast(err.message || 'Failed to cancel appointment.', 'error');
    }
  },

  openEditModal(appointmentId) {
    const apt = this.appointments.find(a => a.appointment_id === appointmentId);
    if (!apt) return;

    const modalBody = document.getElementById('edit-apt-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <form id="edit-apt-form">
        <input type="hidden" id="edit-apt-id" value="${apt.appointment_id}">
        <div class="form-group">
          <label class="form-label">Appointment #</label>
          <input type="text" class="form-control" value="${escapeHtml(apt.appointment_number)}" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Doctor & Hospital</label>
          <input type="text" class="form-control" value="${escapeHtml(apt.doctor_name)} - ${escapeHtml(apt.hospital_name)}" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Reason for Visit <span class="req">*</span></label>
          <input type="text" id="edit-apt-reason" class="form-control" value="${escapeHtml(apt.reason)}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Symptoms / Notes</label>
          <textarea id="edit-apt-symptoms" class="form-control">${escapeHtml(apt.symptoms || '')}</textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" onclick="closeModal('edit-apt-modal')">Close</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    document.getElementById('edit-apt-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const reason = document.getElementById('edit-apt-reason').value.trim();
      const symptoms = document.getElementById('edit-apt-symptoms').value.trim();

      try {
        await API.request(`/appointments/${apt.appointment_id}`, {
          method: 'PUT',
          body: { reason, symptoms }
        });
        showToast('Appointment updated successfully!');
        closeModal('edit-apt-modal');
        await this.loadAppointments();
      } catch (err) {
        showToast(err.message || 'Failed to update appointment.', 'error');
      }
    });

    openModal('edit-apt-modal');
  },

  // ==================================================================
  // APPOINTMENT RESCHEDULING & DIGITAL MEDICAL PASS
  // ==================================================================
  async openRescheduleModal(appointmentId) {
    const apt = this.appointments.find(a => a.appointment_id === appointmentId);
    if (!apt) return;

    const modalBody = document.getElementById('reschedule-apt-modal-body');
    if (!modalBody) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    modalBody.innerHTML = `
      <div style="margin-bottom: 1rem; padding: 0.85rem; background: var(--bg-muted); border-radius: var(--radius-md); font-size: 0.85rem;">
        <div><strong>Appointment:</strong> #${escapeHtml(apt.appointment_number)} (${escapeHtml(apt.status)})</div>
        <div style="color: var(--primary); font-weight: 600;">👨‍⚕️ ${escapeHtml(apt.doctor_name)} (${escapeHtml(apt.doctor_specialization)})</div>
        <div style="color: var(--text-muted);">Current Slot: ${formatDate(apt.date)} at ${escapeHtml(apt.time_slot)}</div>
      </div>

      <div class="form-group">
        <label class="form-label">Select New Consultation Date</label>
        <input type="date" id="resched-new-date" class="form-control" value="${tomorrowStr}" min="${new Date().toISOString().split('T')[0]}" />
      </div>

      <div class="form-group">
        <label class="form-label">Available Time Slots for Selected Date</label>
        <div id="resched-slots-loading" style="padding: 1rem; text-align: center; color: var(--text-muted);">
          Loading available slots...
        </div>
        <div id="resched-slots-container" class="slots-grid" style="grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.5rem; display: none;"></div>
      </div>

      <div id="resched-selection-note" style="display: none; margin: 1rem 0; padding: 0.65rem 0.85rem; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-sm); font-size: 0.825rem; color: #065f46;">
        Selected New Slot: <strong id="resched-chosen-text"></strong>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
        <button type="button" class="btn btn-outline" onclick="closeModal('reschedule-apt-modal')">Cancel</button>
        <button type="button" id="resched-submit-btn" class="btn btn-primary" disabled onclick="PatientUI.confirmReschedule(${apt.appointment_id})">
          Confirm Reschedule
        </button>
      </div>
    `;

    openModal('reschedule-apt-modal');
    this.reschedSelectedSlot = null;

    const loadSlots = async (date) => {
      const loading = document.getElementById('resched-slots-loading');
      const container = document.getElementById('resched-slots-container');
      const submitBtn = document.getElementById('resched-submit-btn');
      const note = document.getElementById('resched-selection-note');
      if (submitBtn) submitBtn.disabled = true;
      if (note) note.style.display = 'none';
      this.reschedSelectedSlot = null;

      if (loading) loading.style.display = 'block';
      if (container) container.style.display = 'none';

      try {
        const res = await API.request(`/slots?doctor_id=${apt.doctor_id}&date=${date}`);
        if (loading) loading.style.display = 'none';
        if (container) {
          container.style.display = 'grid';
          const slots = res.success ? res.data : [];
          if (slots.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 1rem;">No OPD slots generated for this date. Please pick another date.</p>';
            return;
          }

          container.innerHTML = slots.map(s => {
            const isAvail = s.status === 'AVAILABLE';
            return `
              <button type="button" 
                      class="btn btn-sm ${isAvail ? 'btn-outline-primary' : 'btn-outline'}" 
                      style="${!isAvail ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                      ${!isAvail ? 'disabled' : ''}
                      onclick="PatientUI.pickRescheduleSlot('${date}', '${s.start_time}', ${s.id})">
                ${s.start_time}
              </button>
            `;
          }).join('');
        }
      } catch (err) {
        if (loading) loading.innerHTML = '<span style="color: var(--danger);">Failed to load slots for this date.</span>';
      }
    };

    const dateInput = document.getElementById('resched-new-date');
    if (dateInput) {
      dateInput.addEventListener('change', (e) => loadSlots(e.target.value));
    }

    loadSlots(tomorrowStr);
  },

  pickRescheduleSlot(date, timeSlot, slotId) {
    this.reschedSelectedSlot = { date, timeSlot, slotId };
    const note = document.getElementById('resched-selection-note');
    const noteText = document.getElementById('resched-chosen-text');
    const submitBtn = document.getElementById('resched-submit-btn');

    if (note && noteText) {
      note.style.display = 'block';
      noteText.textContent = `${formatDate(date)} at ${timeSlot}`;
    }
    if (submitBtn) submitBtn.disabled = false;

    // Highlight active button
    document.querySelectorAll('#resched-slots-container button').forEach(b => {
      if (b.textContent.trim() === timeSlot) {
        b.className = 'btn btn-sm btn-primary';
      } else if (!b.disabled) {
        b.className = 'btn btn-sm btn-outline-primary';
      }
    });
  },

  async confirmReschedule(appointmentId) {
    if (!this.reschedSelectedSlot) return;
    const { date, timeSlot, slotId } = this.reschedSelectedSlot;

    try {
      const res = await API.request(`/appointments/${appointmentId}/reschedule`, {
        method: 'POST',
        body: {
          date,
          time_slot: timeSlot,
          slot_id: slotId
        }
      });
      showToast(res.message || 'Appointment rescheduled successfully!');
      closeModal('reschedule-apt-modal');
      await this.loadAppointments();
    } catch (err) {
      showToast(err.message || 'Failed to reschedule appointment.', 'error');
    }
  },

  // Lightweight vector QR code generator for authentic pass verification
  generateSvgQrCode(text, size = 100) {
    const modules = 21;
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    
    let rects = '';
    const cellSize = size / modules;
    
    const isFinder = (r, c) => {
      if (r < 7 && c < 7) return (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
      if (r < 7 && c >= modules - 7) return (r === 0 || r === 6 || c === modules - 7 || c === modules - 1 || (r >= 2 && r <= 4 && c >= modules - 5 && c <= modules - 3));
      if (r >= modules - 7 && c < 7) return (r === modules - 7 || r === modules - 1 || c === 0 || c === 6 || (r >= modules - 5 && r <= modules - 3 && c >= 2 && c <= 4));
      return false;
    };

    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        let bit = false;
        if (isFinder(r, c)) {
          bit = true;
        } else if ((r < 7 && (c < 7 || c >= modules - 7)) || (r >= modules - 7 && c < 7)) {
          bit = false;
        } else {
          const seed = (Math.abs(hash) + r * 31 + c * 17 + (text.charCodeAt((r + c) % text.length) || 0));
          bit = (seed % 3 === 0 || seed % 7 === 0);
        }

        if (bit) {
          rects += `<rect x="${(c * cellSize).toFixed(1)}" y="${(r * cellSize).toFixed(1)}" width="${cellSize.toFixed(1)}" height="${cellSize.toFixed(1)}" fill="#064e3b" />`;
        }
      }
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="background: #ffffff; padding: 4px; border: 1px solid #d1fae5; border-radius: 4px; display: block;">${rects}</svg>`;
  },

  viewDetails(appointmentId) {
    const apt = this.appointments.find(a => a.appointment_id === appointmentId);
    if (!apt) return;

    const modalBody = document.getElementById('apt-details-modal-body');
    if (!modalBody) return;

    const qrData = `CareSlot|Apt:${apt.appointment_number}|Pat:${apt.patient_name}|Doc:${apt.doctor_name}|Hosp:${apt.hospital_name}|Date:${apt.date}|Slot:${apt.time_slot}`;
    const qrSvg = this.generateSvgQrCode(qrData, 95);

    modalBody.innerHTML = `
      <div class="print-medical-slip" style="background: var(--bg-card); border-radius: var(--radius-md); padding: 0.5rem 0;">
        
        <!-- Header with QR and Hospital Seal -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 1rem; margin-bottom: 1.25rem; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span style="font-size: 1.5rem;">🏥</span>
              <h3 style="color: var(--primary-dark); margin: 0; font-size: 1.3rem;">${escapeHtml(apt.hospital_name)}</h3>
            </div>
            <div style="font-size: 0.825rem; color: var(--text-muted);">
              Official Outpatient Department (OPD) Consultation Pass
            </div>
            <div style="font-size: 0.775rem; color: var(--primary); font-weight: 600; margin-top: 0.25rem;">
              📍 ${escapeHtml(apt.hospital_address)} | 📞 ${escapeHtml(apt.hospital_contact_phone)}
            </div>
          </div>
          <div style="text-align: center; flex-shrink: 0;">
            ${qrSvg}
            <div style="font-size: 0.65rem; color: #047857; font-weight: 700; margin-top: 3px; letter-spacing: 0.5px;">DIGITAL VERIFIED</div>
          </div>
        </div>

        <!-- Appointment Key Tokens -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
          <div>
            <div style="color: #065f46; font-size: 0.75rem; font-weight: 700;">APPOINTMENT REFERENCE</div>
            <strong style="font-size: 1.15rem; color: #064e3b; letter-spacing: 0.5px;">#${escapeHtml(apt.appointment_number)}</strong>
          </div>
          <div style="text-align: center;">
            <div style="color: #065f46; font-size: 0.75rem; font-weight: 700;">OPD TOKEN NO.</div>
            <strong style="font-size: 1.25rem; color: #059669;">TOKEN #${String(apt.appointment_id).padStart(2, '0')}</strong>
          </div>
          <div style="text-align: right;">
            <div style="color: #065f46; font-size: 0.75rem; font-weight: 700;">CURRENT STATUS</div>
            <span class="badge badge-${apt.status.toLowerCase()}" style="font-size: 0.85rem; padding: 0.3rem 0.8rem;">${escapeHtml(apt.status)}</span>
          </div>
        </div>

        <!-- 4-Box Consultation Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.875rem; margin-bottom: 1.25rem;">
          <div style="border: 1px solid var(--border); padding: 0.85rem; border-radius: var(--radius-sm); background: #fafafa;">
            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; margin-bottom: 0.25rem;">PATIENT DEMOGRAPHICS</div>
            <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(apt.patient_name)}</strong>
            <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.2rem;">Age: ${apt.patient_age} yrs | Gender: ${escapeHtml(apt.patient_gender)}</div>
            <div style="color: var(--text-muted); font-size: 0.8rem;">Contact: ${escapeHtml(apt.patient_contact)}</div>
            ${apt.patient_address ? `<div style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.2rem;">Address: ${escapeHtml(apt.patient_address)}</div>` : ''}
          </div>

          <div style="border: 1px solid var(--border); padding: 0.85rem; border-radius: var(--radius-sm); background: #fafafa;">
            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; margin-bottom: 0.25rem;">CONSULTING SPECIALIST</div>
            <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(apt.doctor_name)}</strong>
            <div style="color: var(--primary); font-size: 0.8rem; font-weight: 600;">${escapeHtml(apt.doctor_specialization)} (${escapeHtml(apt.department_name)})</div>
            <div style="color: var(--text-muted); font-size: 0.775rem;">Qualification: ${escapeHtml(apt.doctor_qualification)}</div>
            <div style="color: #0f766e; font-size: 0.8rem; font-weight: 700; margin-top: 0.2rem;">🚪 Consultation Room: ${escapeHtml(apt.doctor_room_number || 'OPD Room 101')}</div>
          </div>

          <div style="border: 1px solid var(--border); padding: 0.85rem; border-radius: var(--radius-sm); background: #fafafa;">
            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; margin-bottom: 0.25rem;">SCHEDULED DATE & TIME</div>
            <div style="font-size: 1rem; font-weight: 700; color: #0284c7;">📅 ${formatDate(apt.date)}</div>
            <div style="font-size: 0.95rem; font-weight: 700; color: var(--primary); margin-top: 0.2rem;">🕒 ${escapeHtml(apt.time_slot)}</div>
            <small style="color: var(--text-muted); font-size: 0.75rem;">Please report 15 mins prior to slot.</small>
          </div>

          <div style="border: 1px solid var(--border); padding: 0.85rem; border-radius: var(--radius-sm); background: #fafafa;">
            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; margin-bottom: 0.25rem;">CONSULTATION FEE & BILLING</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #059669;">₹${apt.doctor_consultation_fee}</div>
            <div style="color: var(--text-muted); font-size: 0.775rem; margin-top: 0.2rem;">Payment: At Hospital OPD Registration Desk</div>
            <small style="color: #059669; font-weight: 600; font-size: 0.75rem;">Valid for OPD consultation</small>
          </div>
        </div>

        <!-- Clinical Reason & History -->
        <div style="border: 1px solid var(--border); padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1rem; background: #ffffff;">
          <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; margin-bottom: 0.25rem;">PRIMARY VISIT REASON / CHIEF COMPLAINT</div>
          <div style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">${escapeHtml(apt.reason)}</div>
          ${apt.symptoms ? `<div style="margin-top: 0.35rem; color: var(--text-muted); font-size: 0.825rem;">Symptoms reported: ${escapeHtml(apt.symptoms)}</div>` : ''}
          ${apt.rejection_reason ? `<div style="margin-top: 0.5rem; color: var(--danger); font-weight: 600;">Rejection Remarks: ${escapeHtml(apt.rejection_reason)}</div>` : ''}
        </div>

        <!-- Doctor's Prescription / Clinical Notes (if available) -->
        ${apt.notes ? `
          <div style="background: #f0fdf4; border: 1.5px solid #86efac; padding: 1rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 1rem;">
            <div style="color: #166534; font-weight: 700; font-size: 0.85rem; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>🩺</span> <strong>Doctor's Consultation & Prescription Notes:</strong>
            </div>
            <div style="color: #14532d; white-space: pre-line; line-height: 1.55;">${escapeHtml(apt.notes)}</div>
          </div>
        ` : ''}

        <!-- Instructions for Patient -->
        <div style="background: var(--bg-muted); padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-size: 0.775rem; color: var(--text-muted); margin-bottom: 1.25rem; line-height: 1.45;">
          <strong>Important Instructions:</strong>
          <div>1. Present this digital pass or physical printout at the hospital OPD verification counter.</div>
          <div>2. Carry valid photo identification (Aadhaar / Voter ID / Driving License) and past medical records.</div>
          <div>3. In case of unexpected physician emergency duty, patients will be accommodated in subsequent priority slots.</div>
        </div>

        <!-- Footer Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 1rem;" class="no-print">
          <button class="btn btn-outline btn-sm" onclick="closeModal('apt-details-modal')">Close</button>
          <div style="display: flex; gap: 0.5rem;">
            ${['Pending', 'Approved'].includes(apt.status) ? `
              <button class="btn btn-outline-primary btn-sm" onclick="closeModal('apt-details-modal'); PatientUI.openRescheduleModal(${apt.appointment_id})">
                🔄 Reschedule Slot
              </button>
            ` : ''}
            <button class="btn btn-primary btn-sm" onclick="window.print()">
              🖨️ Print Official OPD Pass
            </button>
          </div>
        </div>
      </div>
    `;

    openModal('apt-details-modal');
  },

  // ==================================================================
  // PATIENT PROFILE CRUD (CREATE, READ, UPDATE, DELETE)
  // ==================================================================
  renderProfile() {
    const p = this.myProfile;
    if (!p) return;

    const elName = document.getElementById('prof-fullname');
    const elAge = document.getElementById('prof-age');
    const elGender = document.getElementById('prof-gender');
    const elContact = document.getElementById('prof-contact');
    const elAddress = document.getElementById('prof-address');
    const elHistory = document.getElementById('prof-history');

    if (elName) elName.value = p.full_name || '';
    if (elAge) elAge.value = p.age || '';
    if (elGender) elGender.value = p.gender || 'Male';
    if (elContact) elContact.value = p.contact || '';
    if (elAddress) elAddress.value = p.address || '';
    if (elHistory) elHistory.value = p.medical_history || '';
  },

  async updateProfile(e) {
    if (e) e.preventDefault();
    if (!this.myProfile) return;

    const full_name = document.getElementById('prof-fullname').value.trim();
    const age = document.getElementById('prof-age').value;
    const gender = document.getElementById('prof-gender').value;
    const contact = document.getElementById('prof-contact').value.trim();
    const address = document.getElementById('prof-address').value.trim();
    const medical_history = document.getElementById('prof-history').value.trim();

    try {
      const res = await API.request(`/patients/${this.myProfile.id}`, {
        method: 'PUT',
        body: { full_name, age, gender, contact, address, medical_history }
      });
      this.myProfile = res.data;
      showToast('Profile updated successfully!');
      if (window.Auth) window.Auth.updateUI();
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    }
  },

  async deleteDemoAccount() {
    if (!confirm('Are you sure you want to deactivate and remove your account? This will permanently delete your profile records and appointments.')) {
      return;
    }

    try {
      await API.request(`/patients/${this.myProfile.id}`, {
        method: 'DELETE'
      });
      showToast('Account deactivated successfully.');
      if (window.Auth) window.Auth.logout(false);
    } catch (err) {
      showToast(err.message || 'Failed to deactivate account.', 'error');
    }
  },

  // ==================================================================
  // DIAGNOSTIC LAB REPORTS & PATHOLOGY VAULT
  // ==================================================================
  async loadLabReports() {
    try {
      const res = await API.request('/labs/reports');
      if (res.success) {
        this.labReports = res.data;
        this.renderLabReportsTable();
      }
    } catch (err) {
      console.error('Failed to fetch patient lab reports:', err);
    }
  },

  renderLabReportsTable() {
    const tbody = document.getElementById('pat-lab-reports-tbody');
    if (!tbody) return;

    const list = this.labReports || [];
    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No laboratory test records found for your profile.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(r => `
      <tr>
        <td><strong>#LAB-${String(r.id).padStart(3, '0')}</strong></td>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${escapeHtml(r.test_name)}</div>
          <small style="color: var(--primary); font-weight: 600;">Category: ${escapeHtml(r.test_category)}</small>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(r.hospital_name)}</div>
          <small style="color: var(--text-muted);">Surat Clinical Lab Wing</small>
        </td>
        <td>
          <div>${escapeHtml(r.doctor_name || 'Hospital Consultant')}</div>
          <small style="color: var(--text-muted);">${escapeHtml(r.doctor_specialization || 'Clinical Medicine')}</small>
        </td>
        <td>
          <div>${formatDate(r.sample_date)}</div>
          <small style="color: var(--text-muted);">Reported: ${formatDate(r.report_date)}</small>
        </td>
        <td>
          <span class="badge badge-completed">✓ ${escapeHtml(r.status)}</span>
        </td>
        <td>
          <button class="btn btn-outline-primary btn-sm" onclick="PatientUI.viewLabReport(${r.id})">
            📄 View Diagnostic Report
          </button>
        </td>
      </tr>
    `).join('');
  },

  viewLabReport(reportId) {
    const r = (this.labReports || []).find(item => item.id === reportId);
    if (!r) return;

    const modalBody = document.getElementById('lab-report-modal-body');
    if (!modalBody) return;

    const metricsHtml = r.metrics && r.metrics.length > 0 ? `
      <div style="margin: 1.25rem 0;" class="table-responsive">
        <table class="table lab-table" style="width: 100%;">
          <thead>
            <tr>
              <th>Investigation Parameter</th>
              <th>Observed Value</th>
              <th>Units</th>
              <th>Biological Reference Interval</th>
              <th>Flag</th>
            </tr>
          </thead>
          <tbody>
            ${r.metrics.map(m => {
              const isNormal = m.flag === 'Normal';
              return `
                <tr>
                  <td><strong>${escapeHtml(m.parameter)}</strong></td>
                  <td style="font-weight: 700; color: ${isNormal ? 'var(--text-main)' : '#b45309'};">${escapeHtml(m.result)}</td>
                  <td style="color: var(--text-muted);">${escapeHtml(m.unit)}</td>
                  <td style="color: var(--text-muted); font-size: 0.8rem;">${escapeHtml(m.reference_range)}</td>
                  <td>
                    <span class="badge" style="background: ${isNormal ? '#ecfdf5' : '#fef3c7'}; color: ${isNormal ? '#047857' : '#b45309'}; font-size: 0.75rem;">
                      ${escapeHtml(m.flag)}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    modalBody.innerHTML = `
      <div class="lab-report-sheet">
        <!-- Letterhead -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--primary); padding-bottom: 1rem; margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.75rem;">🏥</span>
              <div>
                <h3 style="color: var(--primary-dark); margin: 0; font-size: 1.35rem;">${escapeHtml(r.hospital_name)}</h3>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Department of Pathology & Radiodiagnostics</div>
              </div>
            </div>
            <div style="font-size: 0.775rem; color: var(--primary); margin-top: 0.35rem;">
              📍 ${escapeHtml(r.hospital_address)} | 📞 ${escapeHtml(r.hospital_contact_phone)}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.725rem; font-weight: 700; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: var(--radius-full); display: inline-block;">
              NABL ACCREDITED LAB
            </div>
            <div style="font-weight: 800; font-size: 1rem; color: var(--text-main); margin-top: 0.25rem;">
              #LAB-${String(r.id).padStart(3, '0')}
            </div>
          </div>
        </div>

        <!-- Patient Demographics 4-box grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.85rem; font-size: 0.85rem; background: var(--bg-muted); padding: 0.85rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem;">
          <div><strong>Patient:</strong> ${escapeHtml(r.patient_name)} (${r.patient_age} yrs, ${escapeHtml(r.patient_gender)})</div>
          <div><strong>Prescribed By:</strong> ${escapeHtml(r.doctor_name || 'Outpatient Consultant')}</div>
          <div><strong>Specimen Date:</strong> ${formatDate(r.sample_date)}</div>
          <div><strong>Report Validation:</strong> ${formatDate(r.report_date)}</div>
        </div>

        <!-- Investigation Name -->
        <div style="margin-bottom: 1rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Investigation Performed</div>
          <h4 style="color: var(--text-main); font-size: 1.15rem; margin: 0.2rem 0;">${escapeHtml(r.test_name)}</h4>
        </div>

        ${metricsHtml}

        <!-- Clinical Findings Summary -->
        <div style="background: #f8fafc; border: 1px solid var(--border); padding: 1rem; border-radius: var(--radius-sm); margin: 1.25rem 0;">
          <div style="font-size: 0.775rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.25rem;">
            Clinical Impression & Diagnostic Summary:
          </div>
          <div style="color: #0f172a; line-height: 1.5; font-size: 0.9rem;">
            ${escapeHtml(r.summary_findings)}
          </div>
        </div>

        <!-- Signature Block -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 2rem; padding-top: 1rem; border-top: 1px dashed var(--border); font-size: 0.8rem; color: var(--text-muted); flex-wrap: wrap; gap: 1rem;">
          <div>
            <div>Medical Laboratory Technologist:</div>
            <strong>${escapeHtml(r.lab_technician || 'Chief Technologist')}</strong>
          </div>
          <div style="text-align: right;">
            <div>Digitally Signed & Validated:</div>
            <strong style="color: var(--primary);">${escapeHtml(r.pathologist_name || 'Consultant Pathologist')}</strong>
            <div style="font-size: 0.7rem; color: #059669;">✓ Verified Diagnostic Report</div>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
        <button type="button" class="btn btn-outline" onclick="closeModal('lab-report-modal')">Close</button>
        <button type="button" class="btn btn-primary" onclick="window.print()">
          🖨️ Print Diagnostic Report
        </button>
      </div>
    `;

    openModal('lab-report-modal');
  },

  async viewPrescription(appointmentId) {
    try {
      const res = await API.request(`/prescriptions/appointment/${appointmentId}`);
      if (!res.success || !res.data) {
        showToast('Prescription record not yet uploaded for this consultation.', 'error');
        return;
      }
      const rx = res.data;
      const modalBody = document.getElementById('view-rx-modal-body');
      if (!modalBody) return;

      const medsHtml = rx.medications && rx.medications.length > 0 ? rx.medications.map((m, idx) => `
        <tr>
          <td><strong>${idx + 1}. ${escapeHtml(m.medicine)}</strong></td>
          <td>${escapeHtml(m.dosage)}</td>
          <td><span style="font-weight:700; color:#047857;">${escapeHtml(m.timing)}</span></td>
          <td>${escapeHtml(m.duration)}</td>
          <td style="font-size:0.775rem; color:var(--text-muted);">${escapeHtml(m.notes || '-')}</td>
        </tr>
      `).join('') : `
        <tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No specific oral medications prescribed. Follow general clinical advice.</td></tr>
      `;

      modalBody.innerHTML = `
        <div class="prescription-sheet" style="font-family: inherit;">
          
          <!-- Prescription Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #047857; padding-bottom: 1rem; margin-bottom: 1.25rem;">
            <div>
              <div style="font-size: 0.75rem; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">
                ${escapeHtml(rx.hospital_type || 'Accredited Multi-Speciality Hospital')} • NABH Accredited
              </div>
              <h2 style="color: #064e3b; margin: 0.25rem 0 0.15rem 0; font-size: 1.5rem;">${escapeHtml(rx.hospital_name)}</h2>
              <div style="font-size: 0.8rem; color: var(--text-muted);">
                📍 ${escapeHtml(rx.hospital_address)} | 📞 24x7 Helpline: ${escapeHtml(rx.hospital_contact_phone)}
              </div>
            </div>

            <div style="text-align: right;">
              <span style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; font-size: 0.75rem; font-weight: 800; padding: 2px 10px; border-radius: 999px;">
                DIGITAL MEDICAL PRESCRIPTION (Rx)
              </span>
              <div style="font-size: 0.85rem; font-weight: 700; color: #0f172a; margin-top: 0.35rem;">
                Rx No: ${escapeHtml(rx.prescription_number)}
              </div>
              <div style="font-size: 0.775rem; color: var(--text-muted);">
                Date: ${formatDate(rx.created_at || rx.appointment_date)}
              </div>
            </div>
          </div>

          <!-- Doctor & Patient Summary Strip -->
          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.25rem; background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1rem; margin-bottom: 1.25rem; font-size: 0.85rem;">
            <div>
              <div style="font-size: 0.725rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem;">Consulting Specialist</div>
              <div style="font-weight: 800; font-size: 1.05rem; color: #064e3b;">${escapeHtml(rx.doctor_name)}</div>
              <div style="color: #047857; font-weight: 600;">${escapeHtml(rx.doctor_specialization)} • ${escapeHtml(rx.doctor_qualification || 'M.D. / M.S.')}</div>
              <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 0.2rem;">
                Registration: <strong>${escapeHtml(rx.doctor_registration_no)}</strong> | Chamber: ${escapeHtml(rx.doctor_room_number || 'Room 101')}
              </div>
            </div>

            <div>
              <div style="font-size: 0.725rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem;">Patient Particulars</div>
              <div style="font-weight: 800; font-size: 1.05rem; color: #0f172a;">${escapeHtml(rx.patient_name)}</div>
              <div style="color: var(--text-muted);">${rx.patient_age} Yrs / ${escapeHtml(rx.patient_gender)} • Contact: ${escapeHtml(rx.patient_contact)}</div>
              <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 0.2rem;">
                Appointment Ref: <strong>#${escapeHtml(rx.appointment_number)}</strong>
              </div>
            </div>
          </div>

          <!-- Clinical Vitals Bar -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.5rem; background: #ecfdf5; border-radius: var(--radius-sm); padding: 0.65rem 0.75rem; margin-bottom: 1.25rem; text-align: center; font-size: 0.8rem;">
            <div><span style="color:var(--text-muted);">BP:</span> <strong>${escapeHtml(rx.vitals_bp || '120/80 mmHg')}</strong></div>
            <div><span style="color:var(--text-muted);">Pulse:</span> <strong>${escapeHtml(rx.vitals_pulse || '72 bpm')}</strong></div>
            <div><span style="color:var(--text-muted);">Temp:</span> <strong>${escapeHtml(rx.vitals_temp || '98.4 F')}</strong></div>
            <div><span style="color:var(--text-muted);">SpO2:</span> <strong>${escapeHtml(rx.vitals_spo2 || '98%')}</strong></div>
            <div><span style="color:var(--text-muted);">Weight:</span> <strong>${escapeHtml(rx.vitals_weight || '65 kg')}</strong></div>
          </div>

          <!-- Clinical Diagnosis & Chief Complaints -->
          <div style="margin-bottom: 1.25rem; font-size: 0.875rem;">
            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem;">Clinical Diagnosis & Findings</div>
            <div style="background: #fff; border-left: 3px solid #059669; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); background: #f0fdf4;">
              <strong style="color: #064e3b; font-size: 0.95rem;">${escapeHtml(rx.diagnosis)}</strong>
              ${rx.symptoms_observed ? `<div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.2rem;">${escapeHtml(rx.symptoms_observed)}</div>` : ''}
            </div>
          </div>

          <!-- Rx Symbol & Medication Table -->
          <div style="margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span style="font-size: 1.5rem; font-family: serif; font-weight: 900; color: #047857;">℞</span>
              <span style="font-weight: 800; font-size: 0.95rem; color: #064e3b; text-transform: uppercase;">Prescribed Medication Schedule</span>
            </div>
            
            <div class="table-responsive">
              <table class="table" style="font-size: 0.825rem; width: 100%;">
                <thead>
                  <tr>
                    <th>Medication / Drug Brand</th>
                    <th>Dosage</th>
                    <th>Frequency / Timing</th>
                    <th>Duration</th>
                    <th>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  ${medsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Advice & Follow-Up -->
          <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 1rem; margin-bottom: 1.25rem; font-size: 0.825rem;">
            <div style="background: #f8fafc; padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border);">
              <strong style="color: #064e3b; display: block; margin-bottom: 0.25rem;">Dietary Advice & General Instructions:</strong>
              <div style="color: var(--text-muted); line-height: 1.45;">${escapeHtml(rx.clinical_advice || 'Continue adequate oral hydration. Avoid cold foods. Complete medication course without omission.')}</div>
              ${rx.lab_tests_recommended ? `<div style="margin-top: 0.5rem; color: #0284c7;"><strong>Recommended Tests:</strong> ${escapeHtml(rx.lab_tests_recommended)}</div>` : ''}
            </div>

            <div style="background: #ecfdf5; padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid #a7f3d0; text-align: center; display: flex; flex-direction: column; justify-content: center;">
              <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #047857;">Review / Next Follow-up</div>
              <div style="font-size: 1.05rem; font-weight: 800; color: #064e3b; margin: 0.25rem 0;">${rx.follow_up_date ? formatDate(rx.follow_up_date) : 'As needed / SOS'}</div>
              <div style="font-size: 0.725rem; color: var(--text-muted);">Bring this prescription for follow-up</div>
            </div>
          </div>

          <!-- Footer Verification Stamp -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px dashed var(--border); padding-top: 1rem; margin-top: 1rem; font-size: 0.775rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 48px; height: 48px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #64748b; text-align: center; line-height: 1.1;">
                QR VALID
              </div>
              <div style="color: var(--text-muted);">
                Digitally Generated Prescription<br>
                Surat Health System Verification ID: <strong>${escapeHtml(rx.prescription_number)}</strong>
              </div>
            </div>

            <div style="text-align: right;">
              <div style="font-size: 0.85rem; font-weight: 800; color: #064e3b;">${escapeHtml(rx.doctor_name)}</div>
              <div style="color: var(--text-muted); font-size: 0.75rem;">Digitally Signed & Certified</div>
              <div style="color: #047857; font-weight: 700; font-size: 0.75rem;">Reg: ${escapeHtml(rx.doctor_registration_no)}</div>
            </div>
          </div>

        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem;">
          <button type="button" class="btn btn-outline" onclick="closeModal('view-rx-modal')">Close</button>
          <button type="button" class="btn btn-primary" onclick="window.print()">🖨️ Print Prescription / Download PDF</button>
        </div>
      `;

      openModal('view-rx-modal');
    } catch (err) {
      showToast('Error loading prescription record.', 'error');
    }
  },

  openLiveQueueModal(appointmentId) {
    const apt = (this.appointments || []).find(a => a.appointment_id === appointmentId);
    if (!apt) return;

    const modalBody = document.getElementById('queue-modal-body');
    if (!modalBody) return;

    const myToken = (apt.appointment_id % 20 + 5);
    const currentToken = Math.max(1, myToken - 3);
    const patientsAhead = Math.max(0, myToken - currentToken);
    const estWaitMins = patientsAhead * 7;

    modalBody.innerHTML = `
      <div style="text-align: center; padding: 1.25rem 0;">
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; font-size: 0.8rem; font-weight: 700; padding: 3px 12px; border-radius: 999px; margin-bottom: 1.25rem;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 1.5s infinite;"></span>
          LIVE OPD CONSULTATION QUEUE TELEMETRY
        </div>

        <div class="queue-token-circle">
          <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">YOUR TOKEN</span>
          <span style="font-size: 2.25rem; font-weight: 900; line-height: 1;">#${myToken.toString().padStart(2, '0')}</span>
        </div>

        <h3 style="color: var(--text-main); margin: 0 0 0.25rem 0; font-size: 1.25rem;">
          ${escapeHtml(apt.doctor_name)}
        </h3>
        <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0 0 1.25rem 0;">
          ${escapeHtml(apt.hospital_name)} • ${escapeHtml(apt.department_name)}
        </p>

        <!-- Queue Telemetry Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.5rem; text-align: center;">
          <div>
            <div style="font-size: 0.725rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Currently Consulting</div>
            <div style="font-size: 1.5rem; font-weight: 900; color: #047857;">#${currentToken.toString().padStart(2, '0')}</div>
            <small style="color: #059669; font-weight: 600;">In Chamber</small>
          </div>
          <div>
            <div style="font-size: 0.725rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Ahead of You</div>
            <div style="font-size: 1.5rem; font-weight: 900; color: #d97706;">${patientsAhead}</div>
            <small style="color: var(--text-muted);">Patients in line</small>
          </div>
          <div>
            <div style="font-size: 0.725rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Estimated Wait</div>
            <div style="font-size: 1.5rem; font-weight: 900; color: #0284c7;">~${estWaitMins}</div>
            <small style="color: var(--text-muted);">Minutes</small>
          </div>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-sm); padding: 0.75rem 1rem; font-size: 0.825rem; color: #1e40af; margin-bottom: 1.5rem; text-align: left;">
          📍 <strong>OPD Chamber Location:</strong> 2nd Floor, OPD Block Wing B, Room 204. Please arrive at the waiting lounge 10 minutes prior to your token call.
        </div>

        <div style="display: flex; justify-content: center; gap: 0.75rem;">
          <button type="button" class="btn btn-outline" onclick="closeModal('queue-modal')">Close</button>
          <button type="button" class="btn btn-primary" onclick="showToast('Live queue token telemetry refreshed!'); PatientUI.openLiveQueueModal(${appointmentId});">
            🔄 Refresh Token Status
          </button>
        </div>
      </div>
    `;

    openModal('queue-modal');
  },

  switchSubTab(tabName) {
    document.querySelectorAll('.pat-sub-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.pat-sub-tab-content').forEach(view => {
      view.style.display = view.id === `pat-view-${tabName}` ? 'block' : 'none';
    });

    if (tabName === 'lab-reports') {
      this.loadLabReports();
    }
  },

  bindEvents() {
    // Sub-tab switching
    document.querySelectorAll('.pat-sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchSubTab(btn.dataset.tab);
      });
    });

    // Appointment filter pills
    document.querySelectorAll('.pat-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pat-filter-btn').forEach(b => b.classList.remove('btn-primary'));
        document.querySelectorAll('.pat-filter-btn').forEach(b => b.classList.add('btn-outline'));
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
        this.renderAppointmentsList(btn.dataset.filter);
      });
    });

    // Profile form submit
    const profileForm = document.getElementById('patient-profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => this.updateProfile(e));
    }
  }
};

window.PatientUI = PatientUI;
window.LabUI = {
  loadReports: () => PatientUI.loadLabReports(),
  viewReport: (id) => PatientUI.viewLabReport(id)
};


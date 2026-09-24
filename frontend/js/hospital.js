// ====================================================================
// ONLINE HOSPITAL APPOINTMENT BOOKING SYSTEM
// Hospital Dashboard, Doctor CRUD, Department CRUD, Slot CRUD & Requests
// ====================================================================

const HospitalUI = {
  currentHospitalId: 1, // Defaults to 1 (Civil Hospital) or logged-in hospital
  stats: {},
  doctors: [],
  departments: [],
  appointments: [],
  slots: [],
  hospitalProfile: null,

  init() {
    this.bindEvents();
  },

  async loadDashboard() {
    // If logged in as hospital admin, use their hospital_id
    if (window.Auth && window.Auth.user && window.Auth.user.hospital_id) {
      this.currentHospitalId = window.Auth.user.hospital_id;
    }

    try {
      await Promise.all([
        this.loadProfile(),
        this.loadStats(),
        this.loadDepartments(),
        this.loadDoctors(),
        this.loadAppointments()
      ]);
    } catch (err) {
      console.error('Error loading hospital dashboard:', err);
    }
  },

  async loadProfile() {
    try {
      const res = await API.request(`/hospitals/${this.currentHospitalId}`);
      if (res.success) {
        this.hospitalProfile = res.data;
        this.renderProfile();
      }
    } catch (err) {
      console.error('Error fetching hospital profile:', err);
    }
  },

  async loadStats() {
    try {
      const res = await API.request(`/hospitals/${this.currentHospitalId}/stats`);
      if (res.success) {
        this.stats = res.data;
        this.renderStats();
      }
    } catch (err) {
      console.error('Error fetching hospital stats:', err);
    }
  },

  renderStats() {
    const s = this.stats;
    const elDocs = document.getElementById('hosp-stat-doctors');
    const elToday = document.getElementById('hosp-stat-today');
    const elPending = document.getElementById('hosp-stat-pending');
    const elApproved = document.getElementById('hosp-stat-approved');
    const elCancelled = document.getElementById('hosp-stat-cancelled');
    const elSlots = document.getElementById('hosp-stat-slots');

    if (elDocs) elDocs.textContent = s.totalDoctors || 0;
    if (elToday) elToday.textContent = s.todayAppointments || 0;
    if (elPending) elPending.textContent = s.pendingRequests || 0;
    if (elApproved) elApproved.textContent = s.approvedCount || 0;
    if (elCancelled) elCancelled.textContent = s.cancelledCount || 0;
    if (elSlots) elSlots.textContent = s.availableSlotsToday || 0;
  },

  renderProfile() {
    const h = this.hospitalProfile;
    if (!h) return;

    const elTitle = document.getElementById('hosp-profile-name-header');
    if (elTitle) elTitle.textContent = h.name;

    const nameInput = document.getElementById('hosp-prof-name');
    const typeInput = document.getElementById('hosp-prof-type');
    const addressInput = document.getElementById('hosp-prof-address');
    const phoneInput = document.getElementById('hosp-prof-phone');
    const emailInput = document.getElementById('hosp-prof-email');
    const websiteInput = document.getElementById('hosp-prof-website');
    const opdInput = document.getElementById('hosp-prof-opd');
    const descInput = document.getElementById('hosp-prof-desc');

    if (nameInput) nameInput.value = h.name || '';
    if (typeInput) typeInput.value = h.type || '';
    if (addressInput) addressInput.value = h.address || '';
    if (phoneInput) phoneInput.value = h.contact_phone || '';
    if (emailInput) emailInput.value = h.email || '';
    if (websiteInput) websiteInput.value = h.website || '';
    if (opdInput) opdInput.value = h.opd_timings || '';
    if (descInput) descInput.value = h.description || '';
  },

  async updateHospitalProfile(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('hosp-prof-name').value.trim();
    const type = document.getElementById('hosp-prof-type').value.trim();
    const address = document.getElementById('hosp-prof-address').value.trim();
    const contact_phone = document.getElementById('hosp-prof-phone').value.trim();
    const email = document.getElementById('hosp-prof-email').value.trim();
    const website = document.getElementById('hosp-prof-website').value.trim();
    const opd_timings = document.getElementById('hosp-prof-opd').value.trim();
    const description = document.getElementById('hosp-prof-desc').value.trim();

    try {
      const res = await API.request(`/hospitals/${this.currentHospitalId}`, {
        method: 'PUT',
        body: { name, type, address, contact_phone, email, website, opd_timings, description }
      });
      showToast('Hospital profile updated successfully!');
      this.hospitalProfile = res.data;
      this.renderProfile();
    } catch (err) {
      showToast(err.message || 'Failed to update hospital details.', 'error');
    }
  },

  // ==================================================================
  // APPOINTMENT REQUESTS MANAGEMENT (APPROVE, REJECT, CANCEL, COMPLETE)
  // ==================================================================
  async loadAppointments() {
    try {
      const res = await API.request(`/appointments?hospital_id=${this.currentHospitalId}`);
      if (res.success) {
        this.appointments = res.data;
        this.renderAppointmentsTable();
        this.renderQueueTable();
      }
    } catch (err) {
      console.error('Error fetching hospital appointments:', err);
    }
  },

  renderAppointmentsTable(statusFilter = 'all') {
    const tbody = document.getElementById('hosp-appointments-tbody');
    if (!tbody) return;

    let list = this.appointments;
    if (statusFilter !== 'all') {
      list = this.appointments.filter(a => a.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No appointment requests found in this filter.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(apt => {
      const isPending = apt.status === 'Pending';
      const isApproved = apt.status === 'Approved';

      return `
        <tr>
          <td><strong>#${escapeHtml(apt.appointment_number)}</strong></td>
          <td>
            <div style="font-weight: 600; cursor: pointer; color: var(--primary);" onclick="HospitalUI.viewPatientDetails(${apt.patient_id})">
              ${escapeHtml(apt.patient_name)}
            </div>
            <small style="color: var(--text-muted);">${apt.patient_age} yrs, ${escapeHtml(apt.patient_gender)} | 📞 ${escapeHtml(apt.patient_contact)}</small>
          </td>
          <td>
            <div style="font-weight: 600;">${escapeHtml(apt.doctor_name)}</div>
            <small style="color: var(--text-muted);">${escapeHtml(apt.department_name)}</small>
          </td>
          <td>
            <div>${formatDate(apt.date)}</div>
            <small style="font-weight: 600; color: var(--primary);">${escapeHtml(apt.time_slot)}</small>
          </td>
          <td style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHtml(apt.reason)}
          </td>
          <td>
            <span class="badge badge-${apt.status.toLowerCase()}">${escapeHtml(apt.status)}</span>
          </td>
          <td>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              ${isPending ? `
                <button class="btn btn-success btn-sm" onclick="HospitalUI.updateStatus(${apt.appointment_id}, 'Approved')">Approve</button>
                <button class="btn btn-danger btn-sm" onclick="HospitalUI.promptReject(${apt.appointment_id})">Reject</button>
              ` : ''}
              ${isApproved ? `
                <button class="btn btn-success btn-sm" onclick="HospitalUI.openCompleteWithPrescriptionModal(${apt.appointment_id})">🩺 Prescribe & Complete</button>
                <button class="btn btn-danger btn-sm" onclick="HospitalUI.updateStatus(${apt.appointment_id}, 'Cancelled')">Cancel</button>
              ` : ''}
              <button class="btn btn-outline btn-sm" onclick="PatientUI.viewDetails(${apt.appointment_id})">View Slip</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  async updateStatus(appointmentId, newStatus, reason = null) {
    try {
      const res = await API.request(`/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        body: { status: newStatus, rejection_reason: reason }
      });
      showToast(res.message || `Appointment status set to ${newStatus}.`);
      await this.loadAppointments();
      await this.loadStats();
      this.renderQueueTable();
    } catch (err) {
      showToast(err.message || 'Status transition failed.', 'error');
    }
  },

  promptReject(appointmentId) {
    const reason = prompt('Please specify a rejection reason for this appointment request:', 'Doctor emergency surgery conflict');
    if (reason !== null) {
      this.updateStatus(appointmentId, 'Rejected', reason);
    }
  },

  // View Synthetic Patient Details
  async viewPatientDetails(patientId) {
    try {
      const res = await API.request(`/patients/${patientId}`);
      if (res.success && res.data) {
        const p = res.data;
        const modalBody = document.getElementById('patient-details-modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem;">
            <div>
              <div style="color: var(--text-muted); font-size: 0.775rem;">PATIENT ID</div>
              <strong>#P${p.id}</strong>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.775rem;">NAME</div>
              <strong>${escapeHtml(p.full_name)}</strong>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.775rem;">AGE & GENDER</div>
              <div>${p.age} years | ${escapeHtml(p.gender)}</div>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.775rem;">CONTACT PHONE</div>
              <div>${escapeHtml(p.contact)}</div>
            </div>
            <div style="grid-column: 1 / -1;">
              <div style="color: var(--text-muted); font-size: 0.775rem;">ADDRESS</div>
              <div>${escapeHtml(p.address || 'Surat, Gujarat')}</div>
            </div>
            <div style="grid-column: 1 / -1; background: var(--bg-muted); padding: 0.75rem; border-radius: var(--radius-sm);">
              <div style="color: var(--text-muted); font-size: 0.775rem;">PAST MEDICAL HISTORY (DEMO)</div>
              <div>${escapeHtml(p.medical_history || 'No significant prior medical illness recorded.')}</div>
            </div>
          </div>
          <div style="margin-top: 1.5rem; text-align: right;">
            <button class="btn btn-outline" onclick="closeModal('patient-details-modal')">Close</button>
          </div>
        `;

        openModal('patient-details-modal');
      }
    } catch (err) {
      showToast('Could not load patient details.', 'error');
    }
  },

  // ==================================================================
  // DOCTOR CRUD (CREATE, READ, UPDATE, DELETE)
  // ==================================================================
  async loadDoctors() {
    try {
      const res = await API.request(`/doctors?hospital_id=${this.currentHospitalId}`);
      if (res.success) {
        this.doctors = res.data;
        this.renderDoctorsTable();
        // Also populate doctor select dropdowns
        this.populateDoctorDropdowns();
        this.populateQueueDoctorFilter();
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  },

  renderDoctorsTable() {
    const tbody = document.getElementById('hosp-doctors-tbody');
    if (!tbody) return;

    if (this.doctors.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No doctors registered. Click "Add Doctor" above.</td></tr>';
      return;
    }

    tbody.innerHTML = this.doctors.map(doc => `
      <tr>
        <td><strong>#${doc.id}</strong></td>
        <td>
          <div style="font-weight: 700;">${escapeHtml(doc.name)}</div>
          <small style="color: var(--text-muted);">${escapeHtml(doc.qualification)}</small>
        </td>
        <td>
          <div>${escapeHtml(doc.specialization)}</div>
          <small style="color: var(--primary);">${escapeHtml(doc.department_name)}</small>
        </td>
        <td>${doc.experience_years} yrs</td>
        <td style="font-weight: 700; color: var(--success);">₹${doc.consultation_fee}</td>
        <td>
          <div>${escapeHtml(doc.opd_timing)}</div>
          <small style="color: var(--text-muted);">${escapeHtml(doc.room_number || 'Room 101')}</small>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn btn-outline-primary btn-sm" onclick="HospitalUI.openEditDoctorModal(${doc.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="HospitalUI.deleteDoctor(${doc.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openAddDoctorModal() {
    const modalBody = document.getElementById('doc-modal-body');
    if (!modalBody) return;

    const deptOptions = this.departments.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');

    modalBody.innerHTML = `
      <form id="add-doctor-form">
        <div class="form-group">
          <label class="form-label">Doctor Name <span class="req">*</span></label>
          <input type="text" id="add-doc-name" class="form-control" placeholder="e.g. Dr. Harish Mehta" required />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Department <span class="req">*</span></label>
            <select id="add-doc-dept" class="form-control" required>
              ${deptOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Experience (Years) <span class="req">*</span></label>
            <input type="number" id="add-doc-exp" class="form-control" value="8" min="1" required />
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Qualification <span class="req">*</span></label>
            <input type="text" id="add-doc-qual" class="form-control" placeholder="MBBS, MS" required />
          </div>
          <div class="form-group">
            <label class="form-label">Specialization <span class="req">*</span></label>
            <input type="text" id="add-doc-spec" class="form-control" placeholder="e.g. Orthopaedic Surgery" required />
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Consultation Fee (₹) <span class="req">*</span></label>
            <input type="number" id="add-doc-fee" class="form-control" value="500" min="0" required />
          </div>
          <div class="form-group">
            <label class="form-label">Room Number</label>
            <input type="text" id="add-doc-room" class="form-control" placeholder="Room 204" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">OPD Timing</label>
          <input type="text" id="add-doc-timing" class="form-control" value="09:00 AM - 01:00 PM" />
        </div>
        <div class="form-group">
          <label class="form-label">Short Biography</label>
          <textarea id="add-doc-bio" class="form-control" placeholder="Clinical experience and background"></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" onclick="closeModal('doctor-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Doctor</button>
        </div>
      </form>
    `;

    document.getElementById('add-doctor-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await API.request('/doctors', {
          method: 'POST',
          body: {
            hospital_id: this.currentHospitalId,
            department_id: parseInt(document.getElementById('add-doc-dept').value),
            name: document.getElementById('add-doc-name').value.trim(),
            qualification: document.getElementById('add-doc-qual').value.trim(),
            specialization: document.getElementById('add-doc-spec').value.trim(),
            experience_years: parseInt(document.getElementById('add-doc-exp').value),
            consultation_fee: parseFloat(document.getElementById('add-doc-fee').value),
            room_number: document.getElementById('add-doc-room').value.trim(),
            opd_timing: document.getElementById('add-doc-timing').value.trim(),
            bio: document.getElementById('add-doc-bio').value.trim()
          }
        });
        showToast('Doctor profile added successfully!');
        closeModal('doctor-modal');
        await this.loadDoctors();
        await this.loadStats();
      } catch (err) {
        showToast(err.message || 'Failed to add doctor.', 'error');
      }
    });

    openModal('doctor-modal');
  },

  openEditDoctorModal(doctorId) {
    const doc = this.doctors.find(d => d.id === doctorId);
    if (!doc) return;

    const modalBody = document.getElementById('doctor-modal-body');
    if (!modalBody) return;

    const deptOptions = this.departments.map(d => `
      <option value="${d.id}" ${d.id === doc.department_id ? 'selected' : ''}>${escapeHtml(d.name)}</option>
    `).join('');

    modalBody.innerHTML = `
      <form id="edit-doctor-form">
        <div class="form-group">
          <label class="form-label">Doctor Name <span class="req">*</span></label>
          <input type="text" id="edit-doc-name" class="form-control" value="${escapeHtml(doc.name)}" required />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Department <span class="req">*</span></label>
            <select id="edit-doc-dept" class="form-control" required>
              ${deptOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Experience (Years) <span class="req">*</span></label>
            <input type="number" id="edit-doc-exp" class="form-control" value="${doc.experience_years}" min="1" required />
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Specialization <span class="req">*</span></label>
            <input type="text" id="edit-doc-spec" class="form-control" value="${escapeHtml(doc.specialization)}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Consultation Fee (₹) <span class="req">*</span></label>
            <input type="number" id="edit-doc-fee" class="form-control" value="${doc.consultation_fee}" min="0" required />
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Room Number</label>
            <input type="text" id="edit-doc-room" class="form-control" value="${escapeHtml(doc.room_number || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label">OPD Timing</label>
            <input type="text" id="edit-doc-timing" class="form-control" value="${escapeHtml(doc.opd_timing || '')}" />
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" onclick="closeModal('doctor-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    document.getElementById('edit-doctor-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await API.request(`/doctors/${doc.id}`, {
          method: 'PUT',
          body: {
            name: document.getElementById('edit-doc-name').value.trim(),
            department_id: parseInt(document.getElementById('edit-doc-dept').value),
            specialization: document.getElementById('edit-doc-spec').value.trim(),
            experience_years: parseInt(document.getElementById('edit-doc-exp').value),
            consultation_fee: parseFloat(document.getElementById('edit-doc-fee').value),
            room_number: document.getElementById('edit-doc-room').value.trim(),
            opd_timing: document.getElementById('edit-doc-timing').value.trim()
          }
        });
        showToast('Doctor details updated successfully!');
        closeModal('doctor-modal');
        await this.loadDoctors();
      } catch (err) {
        showToast(err.message || 'Failed to update doctor.', 'error');
      }
    });

    openModal('doctor-modal');
  },

  async deleteDoctor(doctorId) {
    if (!confirm('Are you sure you want to remove this doctor? Related schedules will be updated.')) {
      return;
    }

    try {
      await API.request(`/doctors/${doctorId}`, { method: 'DELETE' });
      showToast('Doctor removed successfully.');
      await this.loadDoctors();
      await this.loadStats();
    } catch (err) {
      showToast(err.message || 'Failed to delete doctor.', 'error');
    }
  },

  // ==================================================================
  // DEPARTMENT CRUD (CREATE, READ, UPDATE, DELETE)
  // ==================================================================
  async loadDepartments() {
    try {
      const res = await API.request(`/departments?hospital_id=${this.currentHospitalId}`);
      if (res.success) {
        this.departments = res.data;
        this.renderDepartmentsTable();
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  },

  renderDepartmentsTable() {
    const tbody = document.getElementById('hosp-depts-tbody');
    if (!tbody) return;

    if (this.departments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No departments listed. Click "Add Department" above.</td></tr>';
      return;
    }

    tbody.innerHTML = this.departments.map(dept => `
      <tr>
        <td><strong>#${dept.id}</strong></td>
        <td>
          <div style="font-weight: 700;">${escapeHtml(dept.name)}</div>
        </td>
        <td>${escapeHtml(dept.description || 'Specialized clinical care')}</td>
        <td><span class="badge" style="background: #e0f2fe; color: #0369a1;">${dept.total_doctors} Doctors</span></td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn btn-outline-primary btn-sm" onclick="HospitalUI.openEditDeptModal(${dept.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="HospitalUI.deleteDepartment(${dept.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openAddDeptModal() {
    const modalBody = document.getElementById('dept-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <form id="add-dept-form">
        <div class="form-group">
          <label class="form-label">Department Name <span class="req">*</span></label>
          <input type="text" id="add-dept-name" class="form-control" placeholder="e.g. Pulmonology & Chest Medicine" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="add-dept-desc" class="form-control" placeholder="Clinical specialty focus"></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" onclick="closeModal('dept-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Department</button>
        </div>
      </form>
    `;

    document.getElementById('add-dept-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await API.request('/departments', {
          method: 'POST',
          body: {
            hospital_id: this.currentHospitalId,
            name: document.getElementById('add-dept-name').value.trim(),
            description: document.getElementById('add-dept-desc').value.trim()
          }
        });
        showToast('Department added successfully!');
        closeModal('dept-modal');
        await this.loadDepartments();
        await this.loadStats();
      } catch (err) {
        showToast(err.message || 'Failed to add department.', 'error');
      }
    });

    openModal('dept-modal');
  },

  openEditDeptModal(deptId) {
    const dept = this.departments.find(d => d.id === deptId);
    if (!dept) return;

    const modalBody = document.getElementById('dept-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <form id="edit-dept-form">
        <div class="form-group">
          <label class="form-label">Department Name <span class="req">*</span></label>
          <input type="text" id="edit-dept-name" class="form-control" value="${escapeHtml(dept.name)}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="edit-dept-desc" class="form-control">${escapeHtml(dept.description || '')}</textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" onclick="closeModal('dept-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    document.getElementById('edit-dept-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await API.request(`/departments/${dept.id}`, {
          method: 'PUT',
          body: {
            name: document.getElementById('edit-dept-name').value.trim(),
            description: document.getElementById('edit-dept-desc').value.trim()
          }
        });
        showToast('Department updated successfully!');
        closeModal('dept-modal');
        await this.loadDepartments();
      } catch (err) {
        showToast(err.message || 'Failed to update department.', 'error');
      }
    });

    openModal('dept-modal');
  },

  async deleteDepartment(deptId) {
    if (!confirm('Are you sure you want to delete this department? Related doctors must be reassigned or deleted.')) {
      return;
    }

    try {
      await API.request(`/departments/${deptId}`, { method: 'DELETE' });
      showToast('Department removed successfully.');
      await this.loadDepartments();
      await this.loadStats();
    } catch (err) {
      showToast(err.message || 'Failed to delete department.', 'error');
    }
  },

  // ==================================================================
  // TIME SLOTS CRUD (CREATE, READ, UPDATE, DELETE)
  // ==================================================================
  async loadSlotsForManagement() {
    const docSelect = document.getElementById('slot-mgr-doctor');
    const dateInput = document.getElementById('slot-mgr-date');

    const doctorId = docSelect ? docSelect.value : (this.doctors[0] ? this.doctors[0].id : null);
    const date = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0];

    if (!doctorId) return;

    try {
      const res = await API.request(`/slots?doctor_id=${doctorId}&date=${date}`);
      if (res.success) {
        this.slots = res.data;
        this.renderSlotsManagementTable();
      }
    } catch (err) {
      console.error('Error fetching time slots:', err);
    }
  },

  renderSlotsManagementTable() {
    const tbody = document.getElementById('hosp-slots-tbody');
    if (!tbody) return;

    if (this.slots.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No slots found for this doctor and date. Click "Add Custom Slot" to create one.</td></tr>';
      return;
    }

    tbody.innerHTML = this.slots.map(s => {
      const isAvailable = s.status === 'AVAILABLE';
      return `
        <tr>
          <td><strong>#${s.id}</strong></td>
          <td>${formatDate(s.date)}</td>
          <td style="font-weight: 700; color: var(--primary);">${escapeHtml(s.start_time)} - ${escapeHtml(s.end_time)}</td>
          <td>${escapeHtml(s.doctor_name)}</td>
          <td><span class="badge badge-${s.status.toLowerCase()}">${escapeHtml(s.status)}</span></td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-outline btn-sm" onclick="HospitalUI.toggleSlotStatus(${s.id}, '${isAvailable ? 'BLOCKED' : 'AVAILABLE'}')">
                ${isAvailable ? 'Block' : 'Unblock'}
              </button>
              <button class="btn btn-danger btn-sm" onclick="HospitalUI.deleteSlot(${s.id})">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  async toggleSlotStatus(slotId, newStatus) {
    try {
      await API.request(`/slots/${slotId}`, {
        method: 'PUT',
        body: { status: newStatus }
      });
      showToast(`Slot status changed to ${newStatus}.`);
      await this.loadSlotsForManagement();
      await this.loadStats();
    } catch (err) {
      showToast(err.message || 'Failed to update slot status.', 'error');
    }
  },

  async deleteSlot(slotId) {
    if (!confirm('Are you sure you want to delete this time slot?')) return;
    try {
      await API.request(`/slots/${slotId}`, { method: 'DELETE' });
      showToast('Time slot removed.');
      await this.loadSlotsForManagement();
      await this.loadStats();
    } catch (err) {
      showToast(err.message || 'Failed to delete slot.', 'error');
    }
  },

  openAddSlotModal() {
    const modalBody = document.getElementById('slot-modal-body');
    if (!modalBody) return;

    const docOptions = this.doctors.map(d => `<option value="${d.id}">${escapeHtml(d.name)} (${escapeHtml(d.specialization)})</option>`).join('');
    const todayStr = new Date().toISOString().split('T')[0];

    modalBody.innerHTML = `
      <form id="add-slot-form">
        <div class="form-group">
          <label class="form-label">Doctor <span class="req">*</span></label>
          <select id="add-slot-doc" class="form-control" required>
            ${docOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Date <span class="req">*</span></label>
          <input type="date" id="add-slot-date" class="form-control" value="${todayStr}" min="${todayStr}" required />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Start Time <span class="req">*</span></label>
            <input type="text" id="add-slot-start" class="form-control" placeholder="05:00 PM" required />
          </div>
          <div class="form-group">
            <label class="form-label">End Time <span class="req">*</span></label>
            <input type="text" id="add-slot-end" class="form-control" placeholder="05:30 PM" required />
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" onclick="closeModal('slot-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Slot</button>
        </div>
      </form>
    `;

    document.getElementById('add-slot-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await API.request('/slots', {
          method: 'POST',
          body: {
            doctor_id: parseInt(document.getElementById('add-slot-doc').value),
            date: document.getElementById('add-slot-date').value,
            start_time: document.getElementById('add-slot-start').value.trim(),
            end_time: document.getElementById('add-slot-end').value.trim(),
            status: 'AVAILABLE'
          }
        });
        showToast('Time slot created successfully!');
        closeModal('slot-modal');
        await this.loadSlotsForManagement();
        await this.loadStats();
      } catch (err) {
        showToast(err.message || 'Failed to create slot.', 'error');
      }
    });

    openModal('slot-modal');
  },

  populateDoctorDropdowns() {
    const selects = ['sched-doctor-select', 'slot-mgr-doctor'];
    selects.forEach(selId => {
      const el = document.getElementById(selId);
      if (el) {
        el.innerHTML = this.doctors.map(d => `
          <option value="${d.id}">${escapeHtml(d.name)} (${escapeHtml(d.specialization)})</option>
        `).join('');
      }
    });
  },

  // ==================================================================
  // LIVE OPD QUEUE MONITOR & CALL BOARD
  // ==================================================================
  populateQueueDoctorFilter() {
    const filterEl = document.getElementById('queue-doc-filter');
    if (!filterEl) return;
    const currentVal = filterEl.value || 'all';
    let html = '<option value="all">All OPD Consulting Rooms</option>';
    this.doctors.forEach(d => {
      const room = d.room_number ? `(${d.room_number})` : '';
      html += `<option value="${d.id}">${escapeHtml(d.name)} — ${escapeHtml(d.specialization)} ${room}</option>`;
    });
    filterEl.innerHTML = html;
    if (this.doctors.some(d => String(d.id) === currentVal)) {
      filterEl.value = currentVal;
    }
  },

  renderQueueTable() {
    const tbody = document.getElementById('hosp-queue-tbody');
    if (!tbody) return;

    const docFilter = document.getElementById('queue-doc-filter') ? document.getElementById('queue-doc-filter').value : 'all';

    // Active queue consists of Approved (waiting/serving) and Completed
    let queueList = this.appointments.filter(a => {
      const statusMatch = ['Approved', 'Completed'].includes(a.status);
      const docMatch = docFilter === 'all' || String(a.doctor_id) === String(docFilter);
      return statusMatch && docMatch;
    });

    const approvedList = queueList.filter(a => a.status === 'Approved');
    const completedList = queueList.filter(a => a.status === 'Completed');

    // First approved patient is currently serving; second is next
    const servingApt = approvedList[0] || null;
    const nextApt = approvedList[1] || null;

    const servingEl = document.getElementById('queue-serving-token');
    const nextEl = document.getElementById('queue-next-token');
    const waitingEl = document.getElementById('queue-waiting-count');
    const completedEl = document.getElementById('queue-completed-count');

    if (servingEl) servingEl.textContent = servingApt ? `#${String(servingApt.appointment_id).padStart(2, '0')}` : 'None';
    if (nextEl) nextEl.textContent = nextApt ? `#${String(nextApt.appointment_id).padStart(2, '0')}` : 'None';
    if (waitingEl) waitingEl.textContent = approvedList.length;
    if (completedEl) completedEl.textContent = completedList.length;

    if (queueList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">👥</div>
            <strong>No active queue for the selected consulting room.</strong>
            <p style="margin-top: 0.25rem; font-size: 0.85rem;">Approved patient appointments appear here in real-time ready for consultation.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = queueList.map((apt) => {
      const tokenNum = `#${String(apt.appointment_id).padStart(2, '0')}`;
      const isServing = servingApt && servingApt.appointment_id === apt.appointment_id;
      const isCompleted = apt.status === 'Completed';

      let statusBadge = '';
      if (isCompleted) {
        statusBadge = '<span class="badge badge-completed" style="font-weight: 600;">✓ Done</span>';
      } else if (isServing) {
        statusBadge = '<span class="badge queue-pulse-badge" style="background: #dcfce7; color: #15803d; font-weight: 700; border: 1px solid #86efac;">📢 NOW CONSULTING</span>';
      } else {
        statusBadge = `<span class="badge" style="background: #fef3c7; color: #b45309; font-weight: 600;">⏳ Waiting (Pos #${approvedList.indexOf(apt) + 1})</span>`;
      }

      return `
        <tr style="${isServing ? 'background-color: #f0fdf4;' : ''}">
          <td>
            <div style="font-size: 1.15rem; font-weight: 800; color: ${isServing ? 'var(--primary)' : 'var(--text-main)'};">${tokenNum}</div>
            <small style="color: var(--text-muted); font-size: 0.75rem;">#${escapeHtml(apt.appointment_number)}</small>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--text-main); cursor: pointer;" onclick="HospitalUI.viewPatientDetails(${apt.patient_id})">
              ${escapeHtml(apt.patient_name)}
            </div>
            <small style="color: var(--text-muted);">${apt.patient_age}y, ${escapeHtml(apt.patient_gender)} • 📞 ${escapeHtml(apt.patient_contact)}</small>
          </td>
          <td>
            <div style="font-weight: 600;">${escapeHtml(apt.doctor_name)}</div>
            <small style="color: var(--primary); font-weight: 600;">🚪 ${escapeHtml(apt.doctor_room_number || 'Room 101')}</small>
          </td>
          <td>
            <div>${formatDate(apt.date)}</div>
            <small style="font-weight: 700; color: var(--primary);">${escapeHtml(apt.time_slot)}</small>
          </td>
          <td style="max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHtml(apt.reason)}
          </td>
          <td>
            ${statusBadge}
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
              ${!isCompleted ? `
                <button class="btn btn-outline-primary btn-sm" onclick="HospitalUI.announcePatientCall(${apt.appointment_id})">
                  📢 Call Token
                </button>
                <button class="btn btn-success btn-sm" onclick="HospitalUI.openCompleteWithPrescriptionModal(${apt.appointment_id})">
                  🩺 Prescribe
                </button>
              ` : `
                <button class="btn btn-outline btn-sm" onclick="PatientUI.viewDetails(${apt.appointment_id})">
                  View Rx Pass
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  callNextPatient() {
    const approvedList = this.appointments.filter(a => a.status === 'Approved');
    if (approvedList.length === 0) {
      showToast('No waiting patients currently in the OPD queue.', 'info');
      return;
    }
    this.announcePatientCall(approvedList[0].appointment_id);
  },

  announcePatientCall(appointmentId) {
    const apt = this.appointments.find(a => a.appointment_id === appointmentId);
    if (!apt) return;

    const tokenNum = `#${String(apt.appointment_id).padStart(2, '0')}`;
    const room = apt.doctor_room_number || 'OPD Room 101';
    const message = `Token ${tokenNum}, patient ${apt.patient_name}, please proceed to ${room} for ${apt.doctor_name}.`;

    showToast(`📢 Token ${tokenNum} (${apt.patient_name}) called to ${room}`, 'info');

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis unavailable:', err);
      }
    }
  },

  openCompleteWithPrescriptionModal(appointmentId) {
    const apt = this.appointments.find(a => a.appointment_id === appointmentId);
    if (!apt) return;

    const modalBody = document.getElementById('prescription-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <form id="rx-completion-form">
        <div style="background: var(--bg-muted); padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; font-size: 0.85rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <strong>Patient: ${escapeHtml(apt.patient_name)} (${apt.patient_age} yrs, ${escapeHtml(apt.patient_gender)})</strong>
            <span class="badge badge-approved">Token #${String(apt.appointment_id).padStart(2, '0')}</span>
          </div>
          <div style="color: var(--primary); font-weight: 600;">👨‍⚕️ ${escapeHtml(apt.doctor_name)} • ${escapeHtml(apt.doctor_specialization)}</div>
          <div style="color: var(--text-muted); font-size: 0.8rem;">Reason for Visit: ${escapeHtml(apt.reason)}</div>
        </div>

        <div class="form-group">
          <label class="form-label">Clinical Diagnosis / Examination Findings <span class="req">*</span></label>
          <input type="text" id="rx-diagnosis" class="form-control" placeholder="e.g. Acute upper respiratory infection, mild seasonal allergy" required value="Routine clinical evaluation, vital signs stable, symptoms improving" />
        </div>

        <div class="form-group">
          <label class="form-label">Medications & Dosage (Rx) <span class="req">*</span></label>
          <textarea id="rx-medications" class="form-control" rows="3" placeholder="e.g. 1. Tab Paracetamol 650mg TDS x 3 days&#10;2. Tab Cetirizine 10mg OD HS x 5 days" required>1. Tab Paracetamol 650mg — 1 tablet after meals TID for 3 days
2. Tab Pantoprazole 40mg — 1 tablet before breakfast OD for 5 days
3. Multivitamin Zincovit — 1 tablet after lunch OD for 15 days</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Dietary & Lifestyle Advice / Follow-up Plan</label>
          <textarea id="rx-advice" class="form-control" rows="2" placeholder="e.g. Plenty of oral fluids, warm water gargles. Review after 5 days if fever persists.">Adequate oral hydration, warm water gargles, light bland diet. Review in OPD after 5 days or SOS if symptoms worsen.</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" onclick="closeModal('prescription-modal')">Cancel</button>
          <button type="submit" class="btn btn-success">
            ✓ Record Prescription & Complete Consultation
          </button>
        </div>
      </form>
    `;

    document.getElementById('rx-completion-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const diag = document.getElementById('rx-diagnosis').value.trim();
      const meds = document.getElementById('rx-medications').value.trim();
      const advice = document.getElementById('rx-advice').value.trim();

      const fullNotes = `Clinical Diagnosis: ${diag}\n\nPrescription (Rx):\n${meds}\n\nDoctor's Advice & Follow-up:\n${advice}`;

      try {
        const res = await API.request(`/appointments/${apt.appointment_id}/status`, {
          method: 'PATCH',
          body: {
            status: 'Completed',
            notes: fullNotes
          }
        });
        showToast(res.message || 'Consultation completed and digital prescription issued successfully!');
        closeModal('prescription-modal');
        await this.loadAppointments();
        await this.loadStats();
        this.renderQueueTable();
      } catch (err) {
        showToast(err.message || 'Failed to complete consultation.', 'error');
      }
    });

    openModal('prescription-modal');
  },

  switchSubTab(tabName) {
    document.querySelectorAll('.hosp-sub-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.hosp-sub-tab-content').forEach(view => {
      view.style.display = view.id === `hosp-view-${tabName}` ? 'block' : 'none';
    });

    if (tabName === 'queue') {
      this.populateQueueDoctorFilter();
      this.renderQueueTable();
    } else if (tabName === 'schedule') {
      if (window.ScheduleUI) window.ScheduleUI.loadSchedule();
    } else if (tabName === 'slots') {
      this.loadSlotsForManagement();
    }
  },

  bindEvents() {
    // Hospital sub-tab switching
    document.querySelectorAll('.hosp-sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchSubTab(btn.dataset.tab);
      });
    });

    // Appointment table filter buttons
    document.querySelectorAll('.hosp-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.hosp-filter-btn').forEach(b => b.classList.remove('btn-primary'));
        document.querySelectorAll('.hosp-filter-btn').forEach(b => b.classList.add('btn-outline'));
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
        this.renderAppointmentsTable(btn.dataset.filter);
      });
    });

    // Profile form
    const profForm = document.getElementById('hospital-profile-form');
    if (profForm) {
      profForm.addEventListener('submit', (e) => this.updateHospitalProfile(e));
    }

    // Slot Manager Doctor/Date inputs
    const slotDoc = document.getElementById('slot-mgr-doctor');
    const slotDate = document.getElementById('slot-mgr-date');
    if (slotDoc) slotDoc.addEventListener('change', () => this.loadSlotsForManagement());
    if (slotDate) slotDate.addEventListener('change', () => this.loadSlotsForManagement());
  }
};

window.HospitalUI = HospitalUI;

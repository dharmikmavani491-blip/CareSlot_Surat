// ====================================================================
// ONLINE HOSPITAL APPOINTMENT BOOKING SYSTEM
// Main Application Controller & Hash Router
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Modules
  if (window.Auth) window.Auth.init();
  if (window.PatientUI) window.PatientUI.init();
  if (window.HospitalUI) window.HospitalUI.init();
  if (window.ScheduleUI) window.ScheduleUI.init();
  if (window.ApiDocs) window.ApiDocs.init();

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    // Close mobile menu on click link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }

  // Handle SPA Hash Routing
  function handleRoute() {
    const hash = window.location.hash || '#home';
    const cleanRoute = hash.split('?')[0];

    // Hide all view containers
    document.querySelectorAll('.view-page').forEach(page => {
      page.style.display = 'none';
    });

    // Update nav active link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === cleanRoute) {
        link.classList.add('active');
      }
    });

    // Show active view
    switch (cleanRoute) {
      case '#patient':
        if (!window.Auth.user || window.Auth.user.role !== 'patient') {
          showToast('Please sign in as a Patient to access the Patient Dashboard.', 'warning');
          window.location.hash = '#auth';
          return;
        }
        document.getElementById('view-patient').style.display = 'block';
        if (window.PatientUI) window.PatientUI.loadDashboard();
        break;

      case '#hospital':
        if (!window.Auth.user || !['hospital', 'admin'].includes(window.Auth.user.role)) {
          showToast('Please sign in with Hospital credentials to access the Hospital Dashboard.', 'warning');
          window.location.hash = '#auth';
          return;
        }
        document.getElementById('view-hospital').style.display = 'block';
        if (window.HospitalUI) window.HospitalUI.loadDashboard();
        break;

      case '#auth':
        document.getElementById('view-auth').style.display = 'block';
        break;

      case '#home':
      default:
        document.getElementById('view-home').style.display = 'block';
        loadHomeShowcase();
        if (window.HomeDoctorUI) window.HomeDoctorUI.init();
        if (window.BedTrackerUI) window.BedTrackerUI.init();
        if (window.BloodTrackerUI) window.BloodTrackerUI.init();
        if (window.PMJAYUI) window.PMJAYUI.init();
        break;
    }

    // Scroll to top on view change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('hashchange', handleRoute);
  window.handleRoute = handleRoute;
  window.loadHomeShowcase = loadHomeShowcase;
  handleRoute();

  // Load home page hospitals showcase (pure hospital information directory)
  async function loadHomeShowcase() {
    try {
      const res = await API.request('/hospitals');
      const container = document.getElementById('home-hospitals-grid');
      if (res.success && container) {
        container.innerHTML = res.data.map(h => `
          <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
            <div>
              <!-- Hospital Title & Fixed Rating Badge -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.5rem;">
                <h4 style="color: var(--primary-dark); font-size: 1.15rem; margin: 0; line-height: 1.35; flex: 1 1 auto; min-width: 0; word-break: break-word;">${escapeHtml(h.name)}</h4>
                <span class="hospital-rating-badge" title="Accredited Rating">★ ${Number(h.rating).toFixed(1)}</span>
              </div>

              <!-- Hospital Type Tag -->
              <div style="margin-bottom: 0.6rem;">
                <span style="display: inline-block; font-size: 0.725rem; font-weight: 700; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: var(--radius-full); text-transform: uppercase;">
                  ${escapeHtml(h.type || 'Super Speciality Hospital')}
                </span>
              </div>

              <!-- Address -->
              <p style="font-size: 0.825rem; color: var(--primary); font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: flex-start; gap: 0.35rem;">
                <span>📍</span> <span>${escapeHtml(h.address)}, ${escapeHtml(h.city)}</span>
              </p>

              <!-- Description -->
              <p style="font-size: 0.85rem; margin-bottom: 0.85rem; color: var(--text-muted); line-height: 1.45;">
                ${escapeHtml(h.description)}
              </p>

              <!-- Key Facilities / Capacity -->
              <div style="display: flex; gap: 1rem; font-size: 0.8rem; color: var(--text-main); font-weight: 600; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px dashed var(--border);">
                <span>🏢 ${h.total_departments} Clinical Depts</span>
                <span>👨‍⚕️ ${h.total_doctors} Senior Specialists</span>
              </div>
            </div>

            <!-- Detailed Hospital Information Box (No booking button) -->
            <div class="hospital-meta-box">
              <div class="hospital-info-item">
                <span style="font-weight: 600; color: var(--text-main); min-width: 90px;">🕒 OPD Hours:</span>
                <span style="color: var(--text-muted);">${escapeHtml(h.opd_timings)}</span>
              </div>
              <div class="hospital-info-item">
                <span style="font-weight: 600; color: var(--text-main); min-width: 90px;">🚨 Emergency:</span>
                <span style="color: #059669; font-weight: 600;">24x7 Trauma & Casualty Care</span>
              </div>
              <div class="hospital-info-item">
                <span style="font-weight: 600; color: var(--text-main); min-width: 90px;">📞 Helpline:</span>
                <span><a href="tel:${escapeHtml(h.contact_phone)}" style="color: var(--primary); font-weight: 600;">${escapeHtml(h.contact_phone)}</a></span>
              </div>
              <div class="hospital-info-item">
                <span style="font-weight: 600; color: var(--text-main); min-width: 90px;">✉️ Email:</span>
                <span style="word-break: break-all;">${escapeHtml(h.email)}</span>
              </div>
              <div style="margin-top: 0.25rem; padding-top: 0.4rem; border-top: 1px solid rgba(0,0,0,0.06);">
                <a href="${escapeHtml(h.website)}" target="_blank" rel="noopener noreferrer" class="hospital-web-link">
                  🌐 Visit Hospital Web Portal ↗
                </a>
              </div>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {
      console.error('Failed to load home showcase:', e);
    }
  }

  // Quick book helper from home page
  window.startBookingAtHospital = (hospitalId) => {
    if (!window.Auth.user) {
      showToast('Logging in as demo patient to start booking...', 'info');
      window.Auth.demoLogin('rahul.sharma@demo.com', 'patient123')
        .then(() => {
          setTimeout(() => {
            window.location.hash = '#patient';
            if (window.PatientUI) {
              window.PatientUI.switchSubTab('book-appointment');
              window.PatientUI.selectHospital(hospitalId);
            }
          }, 400);
        });
    } else if (window.Auth.user.role === 'patient') {
      window.location.hash = '#patient';
      if (window.PatientUI) {
        window.PatientUI.switchSubTab('book-appointment');
        window.PatientUI.selectHospital(hospitalId);
      }
    } else {
      showToast('Please sign in as a Patient to book an appointment.', 'warning');
    }
  };

  // ==================================================================
  // HOME SPECIALIST DOCTOR DIRECTORY & REAL-TIME SEARCH
  // ==================================================================
  const HomeDoctorUI = {
    doctors: [],
    initialized: false,

    async init() {
      try {
        const res = await API.request('/doctors');
        if (res.success) {
          this.doctors = res.data;
          this.populateSpecialties();
          this.render();
          this.initialized = true;
        }
      } catch (err) {
        console.error('Failed to load doctors directory:', err);
      }
    },

    populateSpecialties() {
      const deptFilter = document.getElementById('home-doc-dept-filter');
      if (!deptFilter) return;

      const specialties = Array.from(new Set(this.doctors.map(d => d.specialization))).sort();
      deptFilter.innerHTML = '<option value="all">All Specialties</option>' +
        specialties.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    },

    filterDoctors() {
      const query = (document.getElementById('home-doc-search')?.value || '').toLowerCase().trim();
      const hospId = document.getElementById('home-doc-hosp-filter')?.value || 'all';
      const spec = document.getElementById('home-doc-dept-filter')?.value || 'all';

      const filtered = this.doctors.filter(d => {
        const matchesQuery = !query ||
          d.name.toLowerCase().includes(query) ||
          d.specialization.toLowerCase().includes(query) ||
          d.department_name.toLowerCase().includes(query) ||
          d.qualification.toLowerCase().includes(query);

        const matchesHosp = hospId === 'all' || d.hospital_id.toString() === hospId;
        const matchesSpec = spec === 'all' || d.specialization.toLowerCase() === spec.toLowerCase();

        return matchesQuery && matchesHosp && matchesSpec;
      });

      this.render(filtered);
    },

    resetFilters() {
      const s = document.getElementById('home-doc-search');
      const h = document.getElementById('home-doc-hosp-filter');
      const d = document.getElementById('home-doc-dept-filter');
      if (s) s.value = '';
      if (h) h.value = 'all';
      if (d) d.value = 'all';
      this.render();
    },

    render(list = this.doctors) {
      const container = document.getElementById('home-doctors-grid');
      if (!container) return;

      if (list.length === 0) {
        container.innerHTML = `
          <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; color: var(--text-muted);">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">👨‍⚕️🔍</div>
            <h4>No specialists found matching your search.</h4>
            <p style="font-size: 0.9rem;">Try searching a different condition or selecting another Surat hospital from the filters above.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = list.map(doc => `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; border-left: 4px solid var(--primary); transition: var(--transition);">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem; gap: 0.5rem;">
              <div>
                <h4 style="color: var(--primary-dark); font-size: 1.05rem; margin: 0;">
                  ${escapeHtml(doc.name)} <span style="color: #059669; font-size: 0.85rem;" title="Verified Doctor">✓</span>
                </h4>
                <div style="font-size: 0.775rem; color: var(--text-muted); font-weight: 500;">${escapeHtml(doc.qualification)}</div>
              </div>
              <span class="badge" style="background: #ecfdf5; color: #065f46; font-size: 0.725rem; border: 1px solid #a7f3d0; white-space: nowrap; flex-shrink: 0;">
                ${escapeHtml(doc.specialization)}
              </span>
            </div>

            <div style="font-size: 0.825rem; font-weight: 600; color: #0284c7; margin: 0.45rem 0;">
              🏥 ${escapeHtml(doc.hospital_name)}
            </div>

            <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 0.75rem; line-height: 1.4;">
              ${escapeHtml(doc.bio || 'Senior medical consultant specializing in advanced diagnosis and outpatient clinical care.')}
            </p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; background: var(--bg-muted); padding: 0.5rem 0.65rem; border-radius: var(--radius-sm); font-size: 0.775rem; color: var(--text-muted); margin-bottom: 0.85rem;">
              <div><strong>Experience:</strong> ${doc.experience_years} Years</div>
              <div><strong>Fee:</strong> <span style="color: #059669; font-weight: 700;">₹${doc.consultation_fee}</span></div>
              <div><strong>Room:</strong> ${escapeHtml(doc.room_number || 'OPD')}</div>
              <div><strong>Timings:</strong> ${escapeHtml(doc.opd_timing || '09 AM - 01 PM')}</div>
            </div>
          </div>

          <div>
            <button class="btn btn-primary btn-block btn-sm" onclick="HomeDoctorUI.bookWithDoctor(${doc.hospital_id}, ${doc.department_id}, ${doc.id})">
              📅 Book Consultation
            </button>
          </div>
        </div>
      `).join('');
    },

    bookWithDoctor(hospitalId, departmentId, doctorId) {
      if (!window.Auth.user) {
        showToast('Signing in as demo patient to schedule appointment...', 'info');
        window.Auth.demoLogin('rahul.sharma@demo.com', 'patient123').then(() => {
          setTimeout(async () => {
            window.location.hash = '#patient';
            if (window.PatientUI) {
              window.PatientUI.switchSubTab('book-appointment');
              await window.PatientUI.selectHospital(hospitalId);
              await window.PatientUI.selectDepartment(departmentId);
              window.PatientUI.selectDoctor(doctorId);
            }
          }, 350);
        });
      } else if (window.Auth.user.role === 'patient') {
        window.location.hash = '#patient';
        if (window.PatientUI) {
          window.PatientUI.switchSubTab('book-appointment');
          window.PatientUI.selectHospital(hospitalId).then(async () => {
            await window.PatientUI.selectDepartment(departmentId);
            window.PatientUI.selectDoctor(doctorId);
          });
        }
      } else {
        showToast('Please login as a patient to schedule an appointment.', 'warning');
      }
    }
  };

  // ==================================================================
  // REAL-TIME SURAT HOSPITAL BED & CRITICAL CARE TRACKER
  // ==================================================================
  const BedTrackerUI = {
    beds: [],
    summary: {},

    async init() {
      try {
        const [resBeds, resSum] = await Promise.all([
          API.request('/facilities/beds'),
          API.request('/facilities/beds/summary')
        ]);

        if (resSum.success) {
          this.summary = resSum.data;
          this.renderSummary();
        }

        if (resBeds.success) {
          this.beds = resBeds.data;
          this.renderBeds(this.beds);
        }
      } catch (err) {
        console.error('Failed to load hospital beds telemetry:', err);
      }
    },

    renderSummary() {
      const s = this.summary;
      const elTotal = document.getElementById('city-total-beds');
      const elGen = document.getElementById('city-avail-general');
      const elOxy = document.getElementById('city-avail-oxygen');
      const elIcu = document.getElementById('city-avail-icu');

      if (elTotal) elTotal.textContent = (s.total_beds || 2350).toLocaleString();
      if (elGen) elGen.textContent = (s.total_available || 543).toLocaleString();
      if (elOxy) elOxy.textContent = (s.available_oxygen || 107).toLocaleString();
      if (elIcu) elIcu.textContent = (s.available_icu || 59).toLocaleString();
    },

    filterBeds() {
      const hospVal = document.getElementById('bed-filter-hospital')?.value || 'all';
      const typeVal = document.getElementById('bed-filter-type')?.value || 'all';

      const filtered = this.beds.filter(b => {
        const matchHosp = hospVal === 'all' || String(b.hospital_id) === hospVal;
        const matchType = typeVal === 'all' || b.bed_type.toLowerCase().includes(typeVal.toLowerCase());
        return matchHosp && matchType;
      });

      this.renderBeds(filtered);
    },

    renderBeds(list) {
      const container = document.getElementById('home-beds-grid');
      if (!container) return;

      if (list.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem; color: var(--text-muted);">
            <p>No bed categories found matching your selected filter.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = list.map(b => {
        const pctOccupied = Math.round((b.occupied / b.total_capacity) * 100);
        const pctAvail = 100 - pctOccupied;
        let progressClass = 'bed-progress-high';
        if (pctAvail < 15) progressClass = 'bed-progress-critical';
        else if (pctAvail < 30) progressClass = 'bed-progress-medium';

        return `
          <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 3px solid ${pctAvail < 15 ? '#ef4444' : '#059669'};">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.35rem;">
                <div>
                  <span style="font-size: 0.725rem; font-weight: 700; color: var(--primary); text-transform: uppercase;">${escapeHtml(b.hospital_name)}</span>
                  <h4 style="font-size: 1.05rem; margin: 0.15rem 0; color: var(--text-main);">${escapeHtml(b.bed_type)}</h4>
                </div>
                <span class="badge" style="background: ${pctAvail > 20 ? '#ecfdf5' : '#fef3c7'}; color: ${pctAvail > 20 ? '#047857' : '#b45309'}; font-size: 0.8rem; font-weight: 800;">
                  ${b.available} Available
                </span>
              </div>

              <div style="font-size: 0.775rem; color: var(--text-muted); margin-bottom: 0.65rem;">
                📍 ${escapeHtml(b.ward_location || 'Hospital Clinical Ward')}
              </div>

              <!-- Occupancy Bar -->
              <div style="margin-bottom: 0.75rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2px;">
                  <span>Occupancy: ${b.occupied} / ${b.total_capacity} beds</span>
                  <strong>${pctOccupied}% full</strong>
                </div>
                <div class="bed-progress-bar">
                  <div class="bed-progress-fill ${progressClass}" style="width: ${pctOccupied}%;"></div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.775rem; background: var(--bg-muted); padding: 0.45rem 0.65rem; border-radius: var(--radius-sm); margin-bottom: 0.85rem;">
                <span>Daily Ward Fee:</span>
                <strong style="color: ${b.charge_per_day === 0 ? '#059669' : 'var(--text-main)'}; font-size: 0.85rem;">
                  ${b.charge_per_day === 0 ? 'Free (Govt Medical Scheme)' : `₹${b.charge_per_day} / day`}
                </strong>
              </div>
            </div>

            <div>
              <a href="tel:${escapeHtml(b.hospital_contact_phone)}" class="btn btn-outline btn-block btn-sm">
                📞 Inquire Bed (${escapeHtml(b.hospital_contact_phone)})
              </a>
            </div>
          </div>
        `;
      }).join('');
    }
  };

  // ==================================================================
  // 108 EMERGENCY AMBULANCE DISPATCH SIMULATOR
  // ==================================================================
  const AmbulanceUI = {
    timerInterval: null,

    openDispatchModal() {
      const modalBody = document.getElementById('ambulance-modal-body');
      if (!modalBody) return;

      modalBody.innerHTML = `
        <form id="ambulance-dispatch-form">
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 0.85rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem;">
            <div style="color: #991b1b; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>🚨</span> <strong>Emergency Response Protocol — Surat Dispatch Center</strong>
            </div>
            <div style="color: #7f1d1d; font-size: 0.8rem; margin-top: 0.25rem;">
              Free 24x7 Government emergency response network connected to GVK EMRI Surat command room.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Pickup Locality / Street Address in Surat <span class="req">*</span></label>
            <select id="amb-locality" class="form-control" required>
              <option value="Majura Gate, Ring Road (Near New Civil Hospital)">Majura Gate / Ring Road (Zone 1)</option>
              <option value="Navyug College Circle, Rander Road, Adajan">Adajan / Navyug Circle & Pal (Zone 2)</option>
              <option value="Katargam, Near Sumul Dairy & Gotalawadi">Katargam / Sumul Dairy Area (Zone 3)</option>
              <option value="Piplod, Dumas Road near VR Mall & Big Bazaar">Piplod / Dumas Road (Zone 4)</option>
              <option value="Varachha, Hirabaug & Mini Bazaar">Varachha / Mini Bazaar (Zone 5)</option>
              <option value="Athwa Gate, Nanpura & Chowk Bazaar">Athwa Gate / Nanpura (Zone 6)</option>
              <option value="Rander, Jahangirpura & Causeway">Rander / Jahangirpura (Zone 7)</option>
              <option value="Udhna, Pandesara & Bhestan Industrial Belt">Udhna / Pandesara (Zone 8)</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Emergency Nature <span class="req">*</span></label>
              <select id="amb-emergency-type" class="form-control" required>
                <option value="Acute Chest Pain / Cardiac Emergency">Cardiac Emergency / Chest Pain</option>
                <option value="Road Traffic Accident / Trauma">Road Traffic Accident / Trauma</option>
                <option value="Severe Respiratory Distress">Severe Respiratory Distress</option>
                <option value="Stroke / Neurological Collapse">Stroke / Neurological Collapse</option>
                <option value="High Risk Maternal / Labour">High-Risk Maternal / Labour</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Ambulance Unit Required</label>
              <select id="amb-type" class="form-control">
                <option value="Advanced Life Support (ALS) - ICU Ventilator Unit">ALS (Advanced Cardiac & Ventilator)</option>
                <option value="Basic Life Support (BLS) - Oxygen & Stretcher">BLS (Basic Oxygen & Stretcher)</option>
                <option value="Neonatal Transport Mobile Unit">Neonatal Transport Unit</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Caller / Patient Name <span class="req">*</span></label>
              <input type="text" id="amb-caller-name" class="form-control" placeholder="e.g. Rahul Sharma" value="${window.Auth && window.Auth.user ? escapeHtml(window.Auth.user.username) : 'Rahul Sharma'}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Emergency Contact Phone <span class="req">*</span></label>
              <input type="tel" id="amb-caller-phone" class="form-control" placeholder="e.g. 9876543210" value="+91-98765-43210" required />
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="button" class="btn btn-outline" onclick="closeModal('ambulance-modal')">Cancel</button>
            <button type="submit" class="btn btn-danger">
              🚨 Dispatch Ambulance Now
            </button>
          </div>
        </form>
      `;

      document.getElementById('ambulance-dispatch-form').addEventListener('submit', (e) => {
        e.preventDefault();
        this.simulateDispatch();
      });

      openModal('ambulance-modal');
    },

    simulateDispatch() {
      const locality = document.getElementById('amb-locality').value;
      const ambType = document.getElementById('amb-type').value;
      const caller = document.getElementById('amb-caller-name').value;
      const condition = document.getElementById('amb-emergency-type').value;

      const vehicleNo = `GJ-05-EM-${Math.floor(1000 + Math.random() * 9000)}`;
      const driverName = 'Kishor Parmar (Lead EMT Paramedic)';
      const driverPhone = '+91-98250-10811';

      let secondsRemaining = 380; // 6 mins 20 secs

      const modalBody = document.getElementById('ambulance-modal-body');
      if (!modalBody) return;

      modalBody.innerHTML = `
        <div style="text-align: center; padding: 1.5rem 0.5rem;">
          <div style="display: inline-block; width: 68px; height: 68px; border-radius: 50%; background: #fee2e2; color: #dc2626; font-size: 2.2rem; line-height: 68px; margin-bottom: 1rem; animation: queuePulse 1.5s infinite;">
            🚑
          </div>
          <h3 style="color: #991b1b; margin-bottom: 0.25rem;">Emergency Ambulance Dispatched!</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">
            Unit dispatched to <strong>${escapeHtml(locality)}</strong>
          </p>

          <div style="background: #ffffff; border: 2px solid #ef4444; border-radius: var(--radius-md); padding: 1.25rem; text-align: left; margin-bottom: 1.5rem; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">ASSIGNED VEHICLE</div>
                <strong style="color: #991b1b; font-size: 1.15rem; letter-spacing: 0.5px;">${vehicleNo}</strong>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">ESTIMATED TIME OF ARRIVAL (ETA)</div>
                <strong id="amb-eta-timer" style="color: #dc2626; font-size: 1.35rem; font-weight: 800;">06:20</strong>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.85rem; margin-bottom: 0.75rem;">
              <div>
                <span style="color: var(--text-muted);">Paramedic Team:</span>
                <div><strong>${driverName}</strong></div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Vehicle Category:</span>
                <div><strong style="color: var(--primary);">${escapeHtml(ambType)}</strong></div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Reported Condition:</span>
                <div>${escapeHtml(condition)}</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Dispatch Center:</span>
                <div>GVK EMRI Surat Ring Road Base</div>
              </div>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: var(--radius-sm); padding: 0.65rem 0.85rem; font-size: 0.8rem; color: #166534; display: flex; align-items: center; gap: 0.5rem;">
              <span>🟢</span> <span>GPS Beacon Active. Vehicle is navigating towards your reported pickup landmark.</span>
            </div>
          </div>

          <div style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
            <a href="tel:${driverPhone}" class="btn btn-danger">
              📞 Call Paramedic Driver (${driverPhone})
            </a>
            <button type="button" class="btn btn-outline" onclick="closeModal('ambulance-modal'); if (AmbulanceUI.timerInterval) clearInterval(AmbulanceUI.timerInterval);">
              Dismiss Window (Dispatch Remains Active)
            </button>
          </div>
        </div>
      `;

      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        secondsRemaining--;
        const mins = Math.floor(secondsRemaining / 60);
        const secs = secondsRemaining % 60;
        const timerEl = document.getElementById('amb-eta-timer');
        if (timerEl) {
          timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        if (secondsRemaining <= 0) {
          clearInterval(this.timerInterval);
          if (timerEl) timerEl.textContent = 'Arrived';
        }
      }, 1000);

      showToast(`🚨 Ambulance ${vehicleNo} dispatched to ${locality}!`, 'success');

      if ('speechSynthesis' in window) {
        try {
          const u = new SpeechSynthesisUtterance(`Emergency ambulance ${vehicleNo} dispatched. Estimated arrival time six minutes.`);
          u.rate = 0.95;
          window.speechSynthesis.speak(u);
        } catch(e) {}
      }
    }
  };

  // ==================================================================
  // PATIENT DOCTOR REVIEW & RATING UI
  // ==================================================================
  const ReviewUI = {
    currentDoctorId: null,
    currentAptId: null,
    selectedRating: 5,
    selectedWaitRating: 5,

    openReviewModal(doctorId, doctorName, appointmentId = null) {
      this.currentDoctorId = doctorId;
      this.currentAptId = appointmentId;
      this.selectedRating = 5;
      this.selectedWaitRating = 5;

      const modalBody = document.getElementById('doctor-review-modal-body');
      if (!modalBody) return;

      modalBody.innerHTML = `
        <form id="doctor-review-form">
          <div style="background: var(--bg-muted); padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem;">
            <div style="font-size: 0.8rem; color: var(--text-muted);">CONSULTING SPECIALIST</div>
            <strong style="font-size: 1.1rem; color: var(--primary);">${escapeHtml(doctorName)}</strong>
            <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 0.2rem;">
              Share your verified outpatient consultation feedback to help fellow patients in Surat.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Overall Clinical Care & Consultation Rating <span class="req">*</span></label>
            <div class="star-rating-select" id="star-picker">
              <span class="star selected" data-value="1">★</span>
              <span class="star selected" data-value="2">★</span>
              <span class="star selected" data-value="3">★</span>
              <span class="star selected" data-value="4">★</span>
              <span class="star selected" data-value="5">★</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Waiting Time Experience</label>
            <select id="review-wait-rating" class="form-control">
              <option value="5">Prompt (Waited less than 15 minutes)</option>
              <option value="4">Reasonable (15 - 30 minutes)</option>
              <option value="3">Average (30 - 45 minutes)</option>
              <option value="2">Long queue (45 - 60 minutes)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Your Clinical Feedback / Review Comments <span class="req">*</span></label>
            <textarea id="review-comment" class="form-control" rows="3" placeholder="How was your diagnosis, doctor's explanation, and overall hospital experience?" required>Very polite and thorough doctor. Explained the diagnosis clearly and answered all questions with patience.</textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="button" class="btn btn-outline" onclick="closeModal('doctor-review-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">
              ⭐ Submit Verified Review
            </button>
          </div>
        </form>
      `;

      // Bind star picker
      const stars = modalBody.querySelectorAll('#star-picker .star');
      stars.forEach(star => {
        star.addEventListener('click', () => {
          const val = parseInt(star.dataset.value);
          this.selectedRating = val;
          stars.forEach(s => {
            s.classList.toggle('selected', parseInt(s.dataset.value) <= val);
          });
        });
      });

      document.getElementById('doctor-review-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const comment = document.getElementById('review-comment').value.trim();
        const waitRating = parseInt(document.getElementById('review-wait-rating').value);

        try {
          const res = await API.request('/facilities/reviews', {
            method: 'POST',
            body: {
              doctor_id: this.currentDoctorId,
              appointment_id: this.currentAptId,
              rating: this.selectedRating,
              wait_time_rating: waitRating,
              comment
            }
          });
          showToast(res.message || 'Thank you! Your verified review has been published.');
          closeModal('doctor-review-modal');
        } catch (err) {
          showToast(err.message || 'Failed to submit review.', 'error');
        }
      });

      openModal('doctor-review-modal');
    }
  };

  // ==================================================================
  // SURAT REGIONAL BLOOD BANK INVENTORY & REQUISITION UI
  // ==================================================================
  const BloodTrackerUI = {
    rawStock: [],

    async init() {
      await Promise.all([
        this.fetchSummary(),
        this.fetchStock()
      ]);
    },

    async fetchSummary() {
      try {
        const res = await API.request('/facilities/blood-inventory/summary');
        if (res.success && res.data) {
          const s = res.data;
          const elTotal = document.getElementById('city-blood-total');
          const elONeg = document.getElementById('city-blood-o-neg');
          const elABPos = document.getElementById('city-blood-ab-pos');
          const elBanks = document.getElementById('city-blood-banks');

          if (elTotal) elTotal.textContent = s.total_units_available || 439;
          if (elONeg) elONeg.textContent = s.units_o_neg || 12;
          if (elABPos) elABPos.textContent = s.units_ab_pos || 41;
          if (elBanks) elBanks.textContent = s.total_blood_banks || 5;
        }
      } catch (err) {
        console.warn('Failed to load blood summary:', err);
      }
    },

    async fetchStock() {
      try {
        const res = await API.request('/facilities/blood-inventory');
        if (res.success) {
          this.rawStock = res.data;
          this.renderStockGrid(this.rawStock);
        }
      } catch (err) {
        console.warn('Failed to load blood stock:', err);
      }
    },

    filterStock() {
      const hospId = document.getElementById('blood-filter-hospital')?.value;
      const bloodGroup = document.getElementById('blood-filter-group')?.value;

      let filtered = this.rawStock;
      if (hospId) {
        filtered = filtered.filter(b => b.hospital_id === parseInt(hospId));
      }
      if (bloodGroup) {
        filtered = filtered.filter(b => b.blood_group === bloodGroup);
      }
      this.renderStockGrid(filtered);
    },

    renderStockGrid(items) {
      const container = document.getElementById('home-blood-grid');
      if (!container) return;

      if (items.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border);">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🩸</div>
            <h4 style="margin: 0 0 0.25rem 0;">No Blood Stock Matching Filter</h4>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0;">Try adjusting your selected hospital or blood group filter.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = items.map(b => {
        let statusBadge = '<span class="badge badge-approved" style="font-size: 0.725rem;">Adequate Stock</span>';
        if (b.status === 'Low Stock') {
          statusBadge = '<span class="badge" style="background: #fef3c7; color: #d97706; border: 1px solid #fde68a; font-size: 0.725rem;">Low Stock</span>';
        } else if (b.status === 'Critical Reserve') {
          statusBadge = '<span class="badge badge-rejected" style="font-size: 0.725rem;">Critical Reserve</span>';
        }

        return `
          <div class="card blood-stat-card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <div class="blood-group-badge">${escapeHtml(b.blood_group)}</div>
                  <div>
                    <h4 style="margin: 0; font-size: 1.05rem; color: var(--text-main); line-height: 1.3;">${escapeHtml(b.component_type)}</h4>
                    <small style="color: var(--text-muted); font-weight: 600;">${escapeHtml(b.hospital_name)}</small>
                  </div>
                </div>
                ${statusBadge}
              </div>

              <div style="background: var(--bg-muted); border-radius: var(--radius-sm); padding: 0.75rem; margin-bottom: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Units In Blood Bank</div>
                  <div style="font-size: 1.35rem; font-weight: 800; color: #dc2626;">${b.units_available} <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Units</span></div>
                </div>
                <div style="text-align: right; font-size: 0.75rem; color: var(--text-muted);">
                  <div>Tested & Screened</div>
                  <div style="color: #059669; font-weight: 700;">✓ Ready for Crossmatch</div>
                </div>
              </div>

              <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0 0 0.85rem 0; display: flex; align-items: center; gap: 0.35rem;">
                <span>📍</span> <span>${escapeHtml(b.hospital_address)}</span>
              </p>
            </div>

            <div style="display: flex; gap: 0.5rem; border-top: 1px dashed var(--border); padding-top: 0.75rem;">
              <a href="tel:${b.helpline_phone}" class="btn btn-outline btn-sm" style="flex: 1; text-align: center; text-decoration: none; font-size: 0.775rem;">
                📞 ${escapeHtml(b.helpline_phone)}
              </a>
              <button class="btn btn-sm" style="background: #dc2626; color: #fff; flex: 1.2; font-size: 0.775rem; font-weight: 700;" onclick="BloodTrackerUI.openRequisitionModal(${b.hospital_id}, '${escapeHtml(b.blood_group)}')">
                🚨 Requisition
              </button>
            </div>
          </div>
        `;
      }).join('');
    },

    openRequisitionModal(hospitalId = null, bloodGroup = null) {
      const modalBody = document.getElementById('blood-request-modal-body');
      if (!modalBody) return;

      const groupOptions = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => `
        <option value="${bg}" ${bloodGroup === bg ? 'selected' : ''}>${bg}</option>
      `).join('');

      modalBody.innerHTML = `
        <div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 1.25rem; font-size: 0.85rem; color: #991b1b; display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.25rem;">⚠️</span>
          <div>
            <strong>Surat Emergency Blood Requisition Protocol:</strong> Authorized blood requisition reserves units for 90 minutes. A verified cross-match EDTA blood sample vial must be brought to the hospital blood centre.
          </div>
        </div>

        <form id="blood-requisition-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label">Patient Full Name <span class="req">*</span></label>
              <input type="text" id="bld-req-name" class="form-control" required placeholder="e.g. Ramesh Patel">
            </div>
            <div class="form-group" style="margin: 0;">
              <label class="form-label">Blood Group Required <span class="req">*</span></label>
              <select id="bld-req-group" class="form-control" required>
                ${groupOptions}
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label">Units Needed <span class="req">*</span></label>
              <select id="bld-req-units" class="form-control" required>
                <option value="1">1 Unit (350 ml)</option>
                <option value="2" selected>2 Units (700 ml)</option>
                <option value="3">3 Units (1050 ml)</option>
                <option value="4">4 Units (1400 ml)</option>
              </select>
            </div>
            <div class="form-group" style="margin: 0;">
              <label class="form-label">Urgency Priority Level <span class="req">*</span></label>
              <select id="bld-req-urgency" class="form-control" required>
                <option value="Immediate / Emergency (Code Red)">Immediate / Emergency (Code Red)</option>
                <option value="Scheduled Surgical Operation">Scheduled Surgical Operation</option>
                <option value="Haematology / Thalassemia Transfusion">Haematology / Thalassemia Transfusion</option>
                <option value="Trauma / ICU Resuscitation">Trauma / ICU Resuscitation</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label">Hospital / Ward / Bed Details <span class="req">*</span></label>
              <input type="text" id="bld-req-room" class="form-control" required placeholder="e.g. Civil Hospital, ICU Bed 04">
            </div>
            <div class="form-group" style="margin: 0;">
              <label class="form-label">Attendant Contact Mobile <span class="req">*</span></label>
              <input type="tel" id="bld-req-phone" class="form-control" required placeholder="e.g. +91 98250 12345">
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn btn-outline" onclick="closeModal('blood-request-modal')">Cancel</button>
            <button type="submit" class="btn" style="background: #dc2626; color: #fff; font-weight: 700; padding: 0.5rem 1.25rem;">
              Confirm Emergency Requisition
            </button>
          </div>
        </form>
      `;

      document.getElementById('blood-requisition-form').addEventListener('submit', (e) => this.submitRequisition(e));
      openModal('blood-request-modal');
    },

    async submitRequisition(e) {
      e.preventDefault();
      const patientName = document.getElementById('bld-req-name').value.trim();
      const bloodGroup = document.getElementById('bld-req-group').value;
      const unitsNeeded = document.getElementById('bld-req-units').value;
      const urgency = document.getElementById('bld-req-urgency').value;
      const room = document.getElementById('bld-req-room').value.trim();
      const phone = document.getElementById('bld-req-phone').value.trim();

      try {
        const res = await API.request('/facilities/blood-request', {
          method: 'POST',
          body: {
            patient_name: patientName,
            blood_group: bloodGroup,
            units_needed: unitsNeeded,
            urgency_level: urgency,
            hospital_room: room,
            contact_phone: phone
          }
        });

        if (res.success && res.data) {
          const d = res.data;
          const modalBody = document.getElementById('blood-request-modal-body');
          modalBody.innerHTML = `
            <div style="text-align: center; padding: 1.5rem 0;">
              <div style="width: 64px; height: 64px; border-radius: 50%; background: #d1fae5; color: #059669; font-size: 2.25rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto;">
                ✓
              </div>
              <h3 style="color: #064e3b; margin: 0 0 0.5rem 0;">Blood Requisition Authorized</h3>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">
                Official requisition code generated by Surat Regional Blood Transfusion Network.
              </p>

              <div style="background: #f8fafc; border: 2px dashed #dc2626; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
                  <div>
                    <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Requisition ID</span>
                    <div style="font-size: 1.15rem; font-weight: 800; color: #dc2626;">${escapeHtml(d.requisition_id)}</div>
                  </div>
                  <div style="text-align: right;">
                    <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Security OTP</span>
                    <div style="font-size: 1.25rem; font-weight: 900; letter-spacing: 2px; color: #0f172a;">${d.verification_code}</div>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.85rem; margin-bottom: 0.5rem;">
                  <div><strong>Patient:</strong> ${escapeHtml(d.patient_name)}</div>
                  <div><strong>Blood Group:</strong> <span style="font-weight: 800; color: #dc2626;">${escapeHtml(d.blood_group)}</span> (${d.units_needed} Units)</div>
                  <div><strong>Priority:</strong> <span style="color: #b91c1c; font-weight: 700;">${escapeHtml(d.urgency_level)}</span></div>
                  <div><strong>Status:</strong> <span style="color: #059669; font-weight: 700;">UNITS RESERVED</span></div>
                </div>

                <div style="background: #ecfdf5; border-radius: var(--radius-sm); padding: 0.75rem; font-size: 0.8rem; color: #064e3b; margin-top: 0.5rem;">
                  <strong>Pickup Instruction:</strong> ${escapeHtml(d.pickup_instructions)}
                </div>
              </div>

              <div style="display: flex; justify-content: center; gap: 1rem;">
                <button class="btn btn-outline" onclick="window.print()">🖨️ Print Requisition Slip</button>
                <button class="btn btn-primary" onclick="closeModal('blood-request-modal'); BloodTrackerUI.fetchStock();">Done</button>
              </div>
            </div>
          `;
          showToast('Blood requisition registered successfully!');
        }
      } catch (err) {
        showToast(err.message || 'Failed to submit blood requisition.', 'error');
      }
    }
  };

  // ==================================================================
  // AYUSHMAN BHARAT PM-JAY & MA GUJARAT SCHEME CHECKER UI
  // ==================================================================
  const PMJAYUI = {
    demoRegistry: {
      'NFSA-SRT-8849': {
        name: 'Rahul Sharma',
        familyId: 'GUJ-SRT-098231',
        members: ['Rahul Sharma (Self)', 'Sunita Sharma (Spouse)', 'Aarav Sharma (Son)', 'Pooja Sharma (Daughter)'],
        category: 'NFSA Priority Household (Gujarat State NFSA)',
        coverAmount: '₹10,00,000 (10 Lakhs Annual Family Cover)',
        status: 'Active & Verified',
        hospitals: [
          { name: 'New Civil Hospital Surat', counter: 'Ayushman Mitra Counter 4, Ground Floor OPD', coverage: '100% Cashless All Departments' },
          { name: 'Kiran Multi Super Speciality Hospital', counter: 'PMJAY Helpdesk Wing A, Katargam', coverage: 'Cardiology, Nephrology, Joint Replacement' },
          { name: 'Shalby Multi-Specialty Hospital', counter: 'TPA Desk, Adajan', coverage: 'Orthopaedics, Joint Replacement, Trauma' },
          { name: 'Sunshine Global Hospital', counter: 'Ayushman Helpdesk, Piplod', coverage: 'Critical Care, Trauma, General Surgery' },
          { name: 'Mahavir Hospital & Research Centre', counter: 'Trust Health Desk, Athwa Gate', coverage: 'Nephrology, Dialysis, General Medicine' }
        ],
        procedures: [
          { code: 'MG-CAR-01', name: 'Coronary Angioplasty (PTCA) with Drug Eluting Stent', pkgRate: '₹65,00,0', coPay: '₹0 (100% Cashless)' },
          { code: 'MG-ORT-05', name: 'Total Knee Replacement (Unilateral)', pkgRate: '₹90,000', coPay: '₹0 (100% Cashless)' },
          { code: 'MG-NEP-02', name: 'Maintenance Haemodialysis (Single Session)', pkgRate: '₹1,500', coPay: '₹0 (100% Cashless)' },
          { code: 'MG-SUR-04', name: 'Laparoscopic Cholecystectomy (Gallbladder)', pkgRate: '₹22,000', coPay: '₹0 (100% Cashless)' }
        ]
      },
      'PMJAY-GUJ-9921': {
        name: 'Pooja Patel',
        familyId: 'GUJ-SRT-443189',
        members: ['Pooja Patel (Self)', 'Kirit Patel (Spouse)', 'Dhruti Patel (Daughter)'],
        category: 'Mukhyamantri Amrutam Vatsalya (MAA Gujarat)',
        coverAmount: '₹10,00,000 (10 Lakhs Annual Family Cover)',
        status: 'Active & Verified',
        hospitals: [
          { name: 'New Civil Hospital Surat', counter: 'Ayushman Mitra Counter 4, Ground Floor OPD', coverage: '100% Cashless All Departments' },
          { name: 'Kiran Multi Super Speciality Hospital', counter: 'PMJAY Helpdesk Wing A, Katargam', coverage: 'Cardiology, Oncology, Orthopaedics' },
          { name: 'Shalby Multi-Specialty Hospital', counter: 'TPA Desk, Adajan', coverage: 'Joint Replacements, Spine Surgery' }
        ],
        procedures: [
          { code: 'MG-CAR-01', name: 'Coronary Angioplasty (PTCA) with Stent', pkgRate: '₹65,000', coPay: '₹0 (100% Cashless)' },
          { code: 'MG-SUR-04', name: 'Laparoscopic Cholecystectomy', pkgRate: '₹22,000', coPay: '₹0 (100% Cashless)' },
          { code: 'MG-ONC-03', name: 'Chemotherapy Cycle (Standard)', pkgRate: '₹18,000', coPay: '₹0 (100% Cashless)' }
        ]
      },
      'MAA-SURAT-4412': {
        name: 'Amitabh Desai',
        familyId: 'GUJ-SRT-771204',
        members: ['Amitabh Desai (Self)', 'Rekha Desai (Spouse)', 'Chirag Desai (Son)', 'Sneha Desai (Daughter-in-Law)', 'Vivaan Desai (Grandson)'],
        category: 'Antyodaya Anna Yojana (AAY Gujarat)',
        coverAmount: '₹10,00,000 (10 Lakhs Annual Family Cover)',
        status: 'Active & Verified',
        hospitals: [
          { name: 'New Civil Hospital Surat', counter: 'Ayushman Mitra Counter 4, Ground Floor OPD', coverage: '100% Cashless All Specialties' },
          { name: 'Mahavir Hospital & Research Centre', counter: 'Trust Health Desk, Athwa Gate', coverage: 'Dialysis, Nephrology, Surgery' },
          { name: 'Kiran Hospital', counter: 'PMJAY Helpdesk Wing A', coverage: 'Cardiac & Neurosurgery' }
        ],
        procedures: [
          { code: 'MG-NEP-02', name: 'Maintenance Haemodialysis', pkgRate: '₹1,500', coPay: '₹0 (100% Cashless)' },
          { code: 'MG-CAR-01', name: 'Coronary Angioplasty (PTCA)', pkgRate: '₹65,000', coPay: '₹0 (100% Cashless)' },
          { code: 'MG-ORT-05', name: 'Total Knee Replacement', pkgRate: '₹90,000', coPay: '₹0 (100% Cashless)' }
        ]
      }
    },

    init() {
      const container = document.getElementById('pmjay-result-container');
      if (container && !container.innerHTML.trim()) {
        this.quickCheck('NFSA-SRT-8849');
      }
    },

    quickCheck(id) {
      const input = document.getElementById('pmjay-search-input');
      if (input) input.value = id;
      this.checkEligibility();
    },

    checkEligibility() {
      const input = document.getElementById('pmjay-search-input');
      const container = document.getElementById('pmjay-result-container');
      if (!input || !container) return;

      const rawId = input.value.trim().toUpperCase();
      if (!rawId) {
        showToast('Please enter an NFSA Card, PMJAY ID, or Aadhaar number.', 'error');
        return;
      }

      const match = this.demoRegistry[rawId] || {
        name: 'Beneficiary (Verified NFSA Card)',
        familyId: `GUJ-SRT-${rawId.slice(-6) || '552910'}`,
        members: ['Primary Applicant (Self)', 'Family Member 1', 'Family Member 2'],
        category: 'NFSA Priority Household (National Food Security Act Gujarat)',
        coverAmount: '₹10,00,000 (10 Lakhs Annual Family Cover)',
        status: 'Active & Verified',
        hospitals: [
          { name: 'New Civil Hospital Surat', counter: 'Ayushman Mitra Counter 4, Ground Floor OPD', coverage: '100% Cashless All Departments' },
          { name: 'Kiran Multi Super Speciality Hospital', counter: 'PMJAY Helpdesk Wing A, Katargam', coverage: 'Cardiology, Nephrology, Joint Replacement' },
          { name: 'Shalby Multi-Specialty Hospital', counter: 'TPA Desk, Adajan', coverage: 'Orthopaedics & Joint Surgery' },
          { name: 'Sunshine Global Hospital', counter: 'Ayushman Helpdesk, Piplod', coverage: 'Trauma & Critical Care' },
          { name: 'Mahavir Hospital & Research Centre', counter: 'Trust Health Desk, Athwa Gate', coverage: 'Dialysis & General Medicine' }
        ],
        procedures: [
          { code: 'MG-CAR-01', name: 'Coronary Angioplasty (PTCA) with Stent', pkgRate: '₹65,000', coPay: '₹0 (100% Cashless)' },
          { code: 'MG-ORT-05', name: 'Total Knee Replacement', pkgRate: '₹90,000', coPay: '₹0 (100% Cashless)' },
          { code: 'MG-NEP-02', name: 'Maintenance Haemodialysis', pkgRate: '₹1,500', coPay: '₹0 (100% Cashless)' },
          { code: 'MG-SUR-04', name: 'Laparoscopic Cholecystectomy', pkgRate: '₹22,000', coPay: '₹0 (100% Cashless)' }
        ]
      };

      container.innerHTML = `
        <div style="background: #ffffff; border: 2px solid #059669; border-radius: var(--radius-md); padding: 1.75rem; box-shadow: var(--shadow-sm); animation: fadeIn 0.3s ease;">
          
          <!-- Verification Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; border-bottom: 2px dashed #a7f3d0; padding-bottom: 1rem; margin-bottom: 1.25rem;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: #d1fae5; color: #065f46; font-size: 0.85rem; font-weight: 800; padding: 4px 12px; border-radius: 999px; margin-bottom: 0.5rem;">
                <span>✓</span> ELIGIBLE & VERIFIED FOR 100% CASHLESS TREATMENT
              </div>
              <h3 style="margin: 0; font-size: 1.4rem; color: #064e3b;">Beneficiary: ${escapeHtml(match.name)}</h3>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
                Card ID: <strong style="color: #0f172a;">${escapeHtml(rawId)}</strong> | Family ID: <strong>${escapeHtml(match.familyId)}</strong>
              </div>
            </div>

            <div style="text-align: right; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-md); padding: 0.75rem 1.25rem;">
              <div style="font-size: 0.75rem; font-weight: 700; color: #047857; text-transform: uppercase;">Available Cashless Cover</div>
              <div style="font-size: 1.35rem; font-weight: 800; color: #065f46;">${escapeHtml(match.coverAmount)}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Zero Out-of-Pocket Expense</div>
            </div>
          </div>

          <!-- Beneficiary Details Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; font-size: 0.85rem;">
            <div style="background: #f8fafc; padding: 0.75rem 1rem; border-radius: var(--radius-sm); border-left: 3px solid #059669;">
              <strong style="color: var(--text-muted); display: block; font-size: 0.75rem; text-transform: uppercase;">Scheme Category</strong>
              <span style="font-weight: 700; color: #0f172a;">${escapeHtml(match.category)}</span>
            </div>
            <div style="background: #f8fafc; padding: 0.75rem 1rem; border-radius: var(--radius-sm); border-left: 3px solid #0284c7;">
              <strong style="color: var(--text-muted); display: block; font-size: 0.75rem; text-transform: uppercase;">Covered Family Members</strong>
              <span style="font-weight: 700; color: #0f172a;">${match.members.length} Registered Beneficiaries</span>
            </div>
            <div style="background: #f8fafc; padding: 0.75rem 1rem; border-radius: var(--radius-sm); border-left: 3px solid #d97706;">
              <strong style="color: var(--text-muted); display: block; font-size: 0.75rem; text-transform: uppercase;">Required at Admission</strong>
              <span style="font-weight: 700; color: #0f172a;">Aadhaar + Ration Card + Doctor Referral</span>
            </div>
          </div>

          <!-- Empanelled Surat Hospitals Table -->
          <h4 style="color: #064e3b; margin: 0 0 0.75rem 0; font-size: 1.05rem;">
            🏥 Empanelled Surat Hospitals & Designated Ayushman Mitra Counters
          </h4>
          <div class="table-responsive" style="margin-bottom: 1.5rem;">
            <table class="table" style="font-size: 0.85rem;">
              <thead>
                <tr>
                  <th>Hospital Name</th>
                  <th>Ayushman Mitra Helpdesk Location</th>
                  <th>Covered Specialties</th>
                  <th>Direct Contact</th>
                </tr>
              </thead>
              <tbody>
                ${match.hospitals.map(h => `
                  <tr>
                    <td><strong>${escapeHtml(h.name)}</strong></td>
                    <td><span style="color: #047857; font-weight: 600;">📍 ${escapeHtml(h.counter)}</span></td>
                    <td>${escapeHtml(h.coverage)}</td>
                    <td><button class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.75rem;" onclick="showToast('Ayushman Mitra Toll-Free Helpline: 14555 / 1800 111 565')">Helpdesk 14555</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Common High-Value Cashless Procedures Covered -->
          <h4 style="color: #064e3b; margin: 0 0 0.75rem 0; font-size: 1.05rem;">
            💉 Sample Covered High-Value Procedures under Gujarat Health Packages
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem;">
            ${match.procedures.map(p => `
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-sm); padding: 0.75rem; font-size: 0.825rem;">
                <div style="font-weight: 700; color: #065f46; margin-bottom: 0.25rem;">${escapeHtml(p.name)}</div>
                <div style="display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.75rem;">
                  <span>Package Code: <strong>${escapeHtml(p.code)}</strong></span>
                  <span style="font-weight: 700; color: #059669;">${escapeHtml(p.coPay)}</span>
                </div>
              </div>
            `).join('')}
          </div>

        </div>
      `;
      showToast('Eligibility verified successfully under PMJAY-MA Gujarat!');
    }
  };

  window.HomeDoctorUI = HomeDoctorUI;
  window.BedTrackerUI = BedTrackerUI;
  window.BloodTrackerUI = BloodTrackerUI;
  window.PMJAYUI = PMJAYUI;
  window.AmbulanceUI = AmbulanceUI;
  window.ReviewUI = ReviewUI;
});


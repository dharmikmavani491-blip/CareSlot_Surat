// ====================================================================
// ONLINE HOSPITAL APPOINTMENT BOOKING SYSTEM
// Section 4: Today's Doctor Schedule & Slot Inspector
// ====================================================================

const ScheduleUI = {
  currentDoctorId: null,
  currentDate: null,
  scheduleData: null,

  init() {
    this.bindEvents();
  },

  async loadSchedule() {
    const docSelect = document.getElementById('sched-doctor-select');
    const dateInput = document.getElementById('sched-date-input');

    if (!docSelect || !docSelect.value) return;

    this.currentDoctorId = docSelect.value;
    this.currentDate = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0];

    try {
      const res = await API.request(`/doctors/${this.currentDoctorId}/schedule?date=${this.currentDate}`);
      if (res.success) {
        this.scheduleData = res;
        this.renderSchedule();
      }
    } catch (err) {
      console.error('Failed to load doctor schedule:', err);
      showToast('Failed to load schedule for doctor.', 'error');
    }
  },

  renderSchedule() {
    const data = this.scheduleData;
    if (!data) return;

    const infoContainer = document.getElementById('sched-doctor-header-info');
    const timelineContainer = document.getElementById('sched-slots-timeline');

    if (infoContainer) {
      infoContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="margin: 0 0 0.25rem 0; color: var(--primary-dark); font-size: 1.35rem;">
              ${escapeHtml(data.doctor.name)}
            </h3>
            <div style="font-weight: 600; color: var(--primary); font-size: 0.95rem;">
              ${escapeHtml(data.doctor.specialization)} • ${escapeHtml(data.doctor.department)}
            </div>
            <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">
              📍 ${escapeHtml(data.doctor.hospital)} | 🚪 ${escapeHtml(data.doctor.room_number || 'OPD')} | 🕒 ${escapeHtml(data.doctor.opd_timing)}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.85rem; color: var(--text-muted);">Schedule Date</div>
            <div style="font-weight: 800; font-size: 1.1rem; color: var(--text-main);">${formatDate(data.date)}</div>
            <span class="badge" style="background: #f1f5f9; color: #475569; font-size: 0.75rem; margin-top: 0.35rem;">
              ${escapeHtml(data.schedule_label)}
            </span>
          </div>
        </div>

        <div style="display: flex; gap: 1.5rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border); font-size: 0.9rem;">
          <div>Total Slots: <strong>${data.summary.total_slots}</strong></div>
          <div style="color: var(--success);">Available Slots: <strong>${data.summary.available_count}</strong></div>
          <div style="color: var(--primary);">Booked Slots: <strong>${data.summary.booked_count}</strong></div>
        </div>
      `;
    }

    if (timelineContainer) {
      if (data.slots.length === 0) {
        timelineContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">No slots generated for this date.</p>';
        return;
      }

      timelineContainer.innerHTML = `
        <div style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text-muted);">
          Click any <strong>Booked Slot</strong> to view synthetic patient details:
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
          ${data.slots.map(s => {
            const isBooked = s.status === 'BOOKED' || s.appointment_id;
            const patientIdStr = s.patient_id ? `#P${s.patient_id}` : (s.appointment_id ? `#APT-${s.appointment_id}` : '');
            const patientNameStr = s.patient_name ? escapeHtml(s.patient_name) : 'Patient booked';

            return `
              <div class="card slot-timeline-row" 
                   style="padding: 0.85rem 1.25rem; display: flex; align-items: center; justify-content: space-between; border-left: 5px solid ${isBooked ? 'var(--primary)' : 'var(--success)'}; cursor: ${isBooked ? 'pointer' : 'default'}; transition: var(--transition);"
                   ${isBooked ? `onclick="ScheduleUI.inspectBookedSlot(${s.slot_id})"` : ''}>
                <div style="display: flex; align-items: center; gap: 1.25rem;">
                  <div style="font-family: monospace; font-weight: 800; font-size: 1rem; color: var(--text-main); min-width: 90px;">
                    ${escapeHtml(s.start_time)}
                  </div>
                  <div>
                    ${isBooked ? `
                      <div style="font-weight: 700; color: var(--primary);">
                        Booked — ${patientNameStr} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">(${patientIdStr})</span>
                      </div>
                      ${s.appointment_reason ? `<div style="font-size: 0.8rem; color: var(--text-muted);">Reason: ${escapeHtml(s.appointment_reason)}</div>` : ''}
                    ` : `
                      <div style="font-weight: 600; color: var(--success);">
                        Available for booking
                      </div>
                    `}
                  </div>
                </div>
                <div>
                  <span class="badge ${isBooked ? 'badge-booked' : 'badge-available'}">
                    ${isBooked ? 'Booked' : 'Available'}
                  </span>
                  ${isBooked ? `<span style="font-size: 0.775rem; color: var(--primary); margin-left: 0.5rem; text-decoration: underline;">View Patient</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  },

  inspectBookedSlot(slotId) {
    const slot = this.scheduleData.slots.find(s => s.slot_id === slotId);
    if (!slot) return;

    const modalBody = document.getElementById('booked-slot-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="background: var(--bg-card); border-radius: var(--radius-md);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 1rem;">
          <div>
            <h3 style="color: var(--primary-dark); margin: 0;">Booked Patient Information</h3>
            <small style="color: var(--text-muted);">Academic Project Synthetic Record</small>
          </div>
          <span class="badge badge-approved" style="font-size: 0.85rem;">Confirmed Slot</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem; margin-bottom: 1.25rem;">
          <div>
            <div style="color: var(--text-muted); font-size: 0.775rem;">PATIENT ID</div>
            <strong style="color: var(--primary); font-size: 1.1rem;">#P${slot.patient_id || '102'}</strong>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.775rem;">DEMO PATIENT NAME</div>
            <strong>${escapeHtml(slot.patient_name || 'Demo Patient')}</strong>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.775rem;">AGE & GENDER</div>
            <div>${slot.patient_age || '35'} years | ${escapeHtml(slot.patient_gender || 'Male')}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.775rem;">CONTACT PHONE</div>
            <div>${escapeHtml(slot.patient_contact || '+91-98250-12345')}</div>
          </div>
        </div>

        <div style="background: var(--bg-muted); padding: 1rem; border-radius: var(--radius-md); font-size: 0.875rem; margin-bottom: 1.25rem;">
          <div style="color: var(--text-muted); font-size: 0.775rem;">APPOINTMENT REASON</div>
          <strong>${escapeHtml(slot.appointment_reason || 'Routine consultation')}</strong>
          <div style="color: var(--text-muted); font-size: 0.775rem; margin-top: 0.5rem;">APPOINTMENT TIME & DATE</div>
          <div>📅 ${formatDate(slot.date)} at 🕒 ${escapeHtml(slot.start_time)}</div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button class="btn btn-primary" onclick="closeModal('booked-slot-modal')">Close</button>
        </div>
      </div>
    `;

    openModal('booked-slot-modal');
  },

  bindEvents() {
    const docSelect = document.getElementById('sched-doctor-select');
    const dateInput = document.getElementById('sched-date-input');

    if (docSelect) {
      docSelect.addEventListener('change', () => this.loadSchedule());
    }

    if (dateInput) {
      const todayStr = new Date().toISOString().split('T')[0];
      dateInput.value = todayStr;
      dateInput.addEventListener('change', () => this.loadSchedule());
    }
  }
};

window.ScheduleUI = ScheduleUI;

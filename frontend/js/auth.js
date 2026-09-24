// ====================================================================
// ONLINE HOSPITAL APPOINTMENT BOOKING SYSTEM
// Authentication & Role-Based Authorization Module
// ====================================================================

const Auth = {
  user: null,
  token: null,
  selectedRole: 'patient', // 'patient' or 'hospital'

  init() {
    this.token = API.getToken();
    this.user = API.getUser();
    this.updateUI();

    // Verify token with backend
    if (this.token) {
      API.request('/auth/me')
        .then(res => {
          if (res.success && res.user) {
            this.user = res.user;
            API.setUser(res.user);
            this.updateUI();
          }
        })
        .catch(() => {
          this.logout(false);
        });
    }

    this.bindEvents();
  },

  bindEvents() {
    // Role selection tabs in Auth form
    const roleBtns = document.querySelectorAll('.role-select-btn');
    roleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        roleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedRole = btn.dataset.role;

        // Toggle hospital selector in register form if registering as hospital
        const hospField = document.getElementById('reg-hospital-field');
        if (hospField) {
          hospField.style.display = this.selectedRole === 'hospital' ? 'block' : 'none';
        }
      });
    });

    // Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Logging in...';

          const res = await API.request('/auth/login', {
            method: 'POST',
            body: { identifier, password }
          });

          this.handleAuthSuccess(res);
          showToast(`Welcome back, ${res.user.patient ? res.user.patient.full_name : res.user.username}!`);
        } catch (err) {
          showToast(err.message || 'Login failed. Please check your credentials.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      });
    }

    // Register Form Submit
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const fullName = document.getElementById('reg-fullname').value.trim();
        const contact = document.getElementById('reg-contact').value.trim();
        const hospitalId = document.getElementById('reg-hospital-id') ? document.getElementById('reg-hospital-id').value : null;
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Creating account...';

          const res = await API.request('/auth/register', {
            method: 'POST',
            body: {
              username,
              email,
              password,
              role: this.selectedRole,
              full_name: fullName,
              contact,
              hospital_id: this.selectedRole === 'hospital' ? hospitalId : null
            }
          });

          this.handleAuthSuccess(res);
          showToast('Account registered successfully! Welcome to CareSystem.');
        } catch (err) {
          showToast(err.message || 'Registration failed.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
        }
      });
    }

    // Home Page Patient Form Submit
    const homePatForm = document.getElementById('home-patient-form');
    if (homePatForm) {
      homePatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('home-pat-email').value.trim();
        const password = document.getElementById('home-pat-pass').value;
        const submitBtn = homePatForm.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Logging in...';
          const res = await API.request('/auth/login', {
            method: 'POST',
            body: { identifier, password }
          });
          this.handleAuthSuccess(res);
          showToast(`Welcome back, ${res.user.patient ? res.user.patient.full_name : res.user.username}!`);
        } catch (err) {
          showToast(err.message || 'Login failed.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In as Patient →';
        }
      });
    }

    // Home Page Hospital Form Submit
    const homeHospForm = document.getElementById('home-hospital-form');
    if (homeHospForm) {
      homeHospForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('home-hosp-email').value.trim();
        const password = document.getElementById('home-hosp-pass').value;
        const submitBtn = homeHospForm.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Authenticating...';
          const res = await API.request('/auth/login', {
            method: 'POST',
            body: { identifier, password }
          });
          this.handleAuthSuccess(res);
          showToast(`Welcome, ${res.user.hospital ? res.user.hospital.name : res.user.username}!`);
        } catch (err) {
          showToast(err.message || 'Hospital login failed.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Access Hospital Portal →';
        }
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  },

  handleAuthSuccess(res) {
    this.token = res.token;
    this.user = res.user;
    API.setToken(res.token);
    API.setUser(res.user);
    this.updateUI();

    // Redirect to respective dashboard
    const targetHash = res.user.role === 'patient' ? '#patient' : '#hospital';
    window.location.hash = targetHash;
    if (typeof window.handleRoute === 'function') {
      window.handleRoute();
    }
    if (res.user.role === 'patient') {
      if (window.PatientUI) window.PatientUI.loadDashboard();
    } else {
      if (window.HospitalUI) window.HospitalUI.loadDashboard();
    }
  },

  // 1-Click Demo Login Function
  async demoLogin(email, password) {
    try {
      showToast(`Logging in with demo account (${email})...`, 'info');
      const res = await API.request('/auth/login', {
        method: 'POST',
        body: { identifier: email, password }
      });
      this.handleAuthSuccess(res);
      showToast(`Logged in successfully as ${res.user.role.toUpperCase()}: ${res.user.patient ? res.user.patient.full_name : res.user.username}`);
    } catch (err) {
      showToast(err.message || 'Demo login failed.', 'error');
    }
  },

  logout(notify = true) {
    this.user = null;
    this.token = null;
    API.setToken(null);
    API.setUser(null);
    this.updateUI();
    window.location.hash = '#home';
    if (typeof window.handleRoute === 'function') {
      window.handleRoute();
    }
    if (notify) showToast('You have been logged out safely.');
  },

  updateUI() {
    const authNav = document.getElementById('nav-auth-section');
    const userNav = document.getElementById('nav-user-section');
    const patientTab = document.getElementById('nav-patient-tab');
    const hospitalTab = document.getElementById('nav-hospital-tab');
    const userDisplay = document.getElementById('nav-user-name');
    const roleBadge = document.getElementById('nav-user-role');

    if (this.user) {
      if (authNav) authNav.style.display = 'none';
      if (userNav) userNav.style.display = 'flex';

      const displayName = this.user.patient
        ? this.user.patient.full_name
        : (this.user.hospital ? this.user.hospital.name : this.user.username);

      if (userDisplay) userDisplay.textContent = displayName;
      if (roleBadge) {
        roleBadge.textContent = this.user.role;
        roleBadge.className = `user-badge-role role-${this.user.role}`;
      }

      // Show tab based on role
      if (patientTab) patientTab.style.display = this.user.role === 'patient' ? 'flex' : 'none';
      if (hospitalTab) hospitalTab.style.display = ['hospital', 'admin'].includes(this.user.role) ? 'flex' : 'none';
    } else {
      if (authNav) authNav.style.display = 'flex';
      if (userNav) userNav.style.display = 'none';
      if (patientTab) patientTab.style.display = 'none';
      if (hospitalTab) hospitalTab.style.display = 'none';
    }
  }
};

window.Auth = Auth;

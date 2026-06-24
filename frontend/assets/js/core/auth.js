/**
 * Auth page logic — login.html & register.html
 * Works on any static server (python -m http.server, npx serve, etc.)
 */
const AuthPage = {
  init() {
    // Detect page by filename — reliable on any server
    const path = window.location.pathname;
    if (path.includes('register')) {
      this.initRegister();
    } else {
      this.initLogin();
    }
  },

  initLogin() {
    // If already logged in, skip to app
    // (No checkAuth here — it would need a fetch and create a delay.
    //  index.html handles the redirect loop if already authenticated.)

    const form = document.getElementById('loginForm');
    if (!form) { console.error('loginForm not found'); return; }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });

    document.getElementById('demoLoginBtn')?.addEventListener('click', () => {
      document.getElementById('email').value = 'demo@flowsmart.com';
      document.getElementById('password').value = 'demo123456';
      this.handleLogin();
    });

    this.setupPasswordToggles();
  },

  initRegister() {
    const form = document.getElementById('registerForm');
    if (!form) { console.error('registerForm not found'); return; }

    document.getElementById('password')?.addEventListener('input', (e) => {
      this.checkPasswordStrength(e.target.value);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleRegister();
    });

    this.setupPasswordToggles();
  },

  setupPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const input = this.closest('.password-input-wrapper').querySelector('input');
        if (input.type === 'password') {
          input.type = 'text';
          this.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
        } else {
          input.type = 'password';
          this.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle></svg>`;
        }
      });
    });
  },

  setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (loading) {
      text?.classList.add('hidden');
      loader?.classList.remove('hidden');
      btn.disabled = true;
    } else {
      text?.classList.remove('hidden');
      loader?.classList.add('hidden');
      btn.disabled = false;
    }
  },

  clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
  },

  showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  },

  async handleLogin() {
    this.clearErrors();

    const email    = document.getElementById('email')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';

    let valid = true;
    if (!email)    { this.showError('emailError', 'Email is required'); valid = false; }
    if (!password) { this.showError('passwordError', 'Password is required'); valid = false; }
    if (!valid) return;

    this.setLoading('loginBtn', true);

    try {
      const response = await api.login(email, password);

      if (response.success) {
        // Store minimal user info so index.html loads fast
        FlowSmart.state.isAuthenticated = true;
        FlowSmart.state.user = response.user;
        Toast.show('Welcome back!', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 600);
      } else {
        Toast.show(response.message || 'Login failed', 'error');
      }
    } catch (error) {
      Toast.show(error.message || 'Cannot connect to server', 'error');
    } finally {
      this.setLoading('loginBtn', false);
    }
  },

  async handleRegister() {
    this.clearErrors();

    const name            = document.getElementById('name')?.value.trim() || '';
    const businessName    = document.getElementById('businessName')?.value.trim() || '';
    const email           = document.getElementById('email')?.value.trim() || '';
    const password        = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';

    let valid = true;
    if (!name)               { this.showError('nameError', 'Full name is required'); valid = false; }
    if (!email)              { this.showError('emailError', 'Email is required'); valid = false; }
    if (password.length < 8) { this.showError('passwordError', 'Minimum 8 characters'); valid = false; }
    if (password !== confirmPassword) { this.showError('confirmPasswordError', 'Passwords do not match'); valid = false; }
    if (!valid) return;

    this.setLoading('registerBtn', true);

    try {
      const response = await api.register({ name, businessName, email, password });

      if (response.success) {
        Toast.show('Account created! Redirecting…', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
      } else {
        Toast.show(response.message || 'Registration failed', 'error');
      }
    } catch (error) {
      Toast.show(error.message || 'Cannot connect to server', 'error');
    } finally {
      this.setLoading('registerBtn', false);
    }
  },

  checkPasswordStrength(password) {
    const bar  = document.getElementById('strengthBar');
    const text = document.getElementById('strengthText');
    if (!bar || !text) return;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', 'var(--color-danger)', 'var(--color-amber)', 'var(--color-primary)', 'var(--color-primary)'];

    bar.style.width           = `${(strength / 4) * 100}%`;
    bar.style.backgroundColor = colors[strength] || colors[1];
    text.textContent          = levels[strength] || '';
    text.style.color          = colors[strength] || colors[1];
  },
};
/**
 * Authentication page logic
 * FIX #4: Removed the duplicate orphaned auth.js - this is the only auth file.
 */
const AuthPage = {
  init() {
    if (FlowSmart.state.isAuthenticated) {
      window.location.href = '/';
      return;
    }

    const path = window.location.pathname;
    if (path.includes('login.html')) {
      this.initLogin();
    } else if (path.includes('register.html')) {
      this.initRegister();
    }
  },

  initLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });

    const demoBtn = document.getElementById('demoLoginBtn');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        document.getElementById('email').value = 'demo@flowsmart.com';
        document.getElementById('password').value = 'demo123456';
      });
    }

    // FIX #4: Password toggle now correctly scoped here instead of a loose orphan script
    this.setupPasswordToggles();
  },

  initRegister() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        this.checkPasswordStrength(passwordInput.value);
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleRegister();
    });

    this.setupPasswordToggles();
  },

  setupPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const wrapper = this.closest('.password-input-wrapper');
        const input = wrapper.querySelector('input');
        
        if (input.type === 'password') {
          input.type = 'text';
          this.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          `;
        } else {
          input.type = 'password';
          this.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          `;
        }
      });
    });
  },

  async handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    
    let hasError = false;
    if (!email) {
      document.getElementById('emailError').textContent = 'Email is required';
      hasError = true;
    }
    if (!password) {
      document.getElementById('passwordError').textContent = 'Password is required';
      hasError = true;
    }
    if (hasError) return;

    const btn = document.getElementById('loginBtn');
    btn.querySelector('.btn-text').classList.add('hidden');
    btn.querySelector('.btn-loader').classList.remove('hidden');
    btn.disabled = true;

    try {
      const response = await api.login(email, password);
      
      if (response.success) {
        FlowSmart.state.isAuthenticated = true;
        FlowSmart.state.user = response.user;
        FlowSmart.state.currency = response.user.currency || 'UGX';
        window.location.href = '/';
      }
    } catch (error) {
      Toast.show(error.message, 'error');
    } finally {
      btn.querySelector('.btn-text').classList.remove('hidden');
      btn.querySelector('.btn-loader').classList.add('hidden');
      btn.disabled = false;
    }
  },

  async handleRegister() {
    const name = document.getElementById('name').value.trim();
    const businessName = document.getElementById('businessName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    
    let hasError = false;
    if (!name) {
      document.getElementById('nameError').textContent = 'Full name is required';
      hasError = true;
    }
    if (!email) {
      document.getElementById('emailError').textContent = 'Email is required';
      hasError = true;
    }
    if (password.length < 8) {
      document.getElementById('passwordError').textContent = 'Password must be at least 8 characters';
      hasError = true;
    }
    if (password !== confirmPassword) {
      document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
      hasError = true;
    }
    if (hasError) return;

    const btn = document.getElementById('registerBtn');
    btn.querySelector('.btn-text').classList.add('hidden');
    btn.querySelector('.btn-loader').classList.remove('hidden');
    btn.disabled = true;

    try {
      const response = await api.register({ name, businessName, email, password });
      
      if (response.success) {
        FlowSmart.state.isAuthenticated = true;
        FlowSmart.state.user = response.user;
        Toast.show('Account created successfully!', 'success');
        setTimeout(() => { window.location.href = '/'; }, 1000);
      }
    } catch (error) {
      Toast.show(error.message, 'error');
    } finally {
      btn.querySelector('.btn-text').classList.remove('hidden');
      btn.querySelector('.btn-loader').classList.add('hidden');
      btn.disabled = false;
    }
  },

  checkPasswordStrength(password) {
    const bar = document.getElementById('strengthBar');
    const text = document.getElementById('strengthText');
    if (!bar || !text) return;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    const levels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['var(--color-danger)', 'var(--color-amber)', 'var(--color-primary)', 'var(--color-primary)'];
    
    bar.style.width = `${(strength / 4) * 100}%`;
    bar.style.backgroundColor = colors[strength - 1] || 'var(--color-danger)';
    text.textContent = levels[strength - 1] || 'Weak';
    text.style.color = colors[strength - 1] || 'var(--color-danger)';
  },
};

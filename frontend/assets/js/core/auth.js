/**
 * Authentication page logic
 */
const AuthPage = {
  init() {
    // Check if already logged in
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

    // Demo login
    const demoBtn = document.getElementById('demoLoginBtn');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        document.getElementById('email').value = 'demo@flowsmart.com';
        document.getElementById('password').value = 'demo123456';
      });
    }

    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
      });
    });
  },

  initRegister() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    // Password strength checker
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
  },

  async handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Clear errors
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    
    // Validate
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

    // Show loader
    const btn = document.getElementById('loginBtn');
    btn.querySelector('.btn-text').classList.add('hidden');
    btn.querySelector('.btn-loader').classList.remove('hidden');
    btn.disabled = true;

    try {
      const response = await api.login(email, password);
      
      if (response.success) {
        FlowSmart.state.isAuthenticated = true;
        FlowSmart.state.user = response.user;
        FlowSmart.state.currency = response.user.currency;
        
        // Redirect to dashboard
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
    
    // Clear errors
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    
    // Validate
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
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
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
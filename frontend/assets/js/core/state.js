/**
 * Global application state management
 */
const FlowSmart = {
  // State
  state: {
    isAuthenticated: false,
    user: null,
    currentRoute: null,
    theme: 'dark',
    currency: 'UGX',
    isLoading: false,
  },

  // Event listeners
  listeners: new Map(),

  /**
   * Initialize the application
   */
  async init() {
    // Check for stored theme
    const savedTheme = localStorage.getItem('flowsmart-theme');
    if (savedTheme) {
      this.state.theme = savedTheme;
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Check authentication status
    const userData = await this.checkAuth();
    
    if (userData) {
      this.state.isAuthenticated = true;
      this.state.user = userData.user;
      this.state.currency = userData.user.currency || 'UGX';
      
      // Check if we're on auth pages
      const currentPath = window.location.pathname;
      if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
        window.location.href = '/';
        return;
      }
      
      // Initialize the main app
      this.initApp();
    } else {
      // Redirect to login if not on auth page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('login.html') && !currentPath.includes('register.html')) {
        window.location.href = '/login.html';
        return;
      }
      
      // Initialize auth page
      if (typeof AuthPage !== 'undefined') {
        AuthPage.init();
      }
    }

    // Remove initial loader
    const loader = document.querySelector('.initial-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 300);
    }
  },

  /**
   * Check authentication status
   */
  async checkAuth() {
    try {
      const response = await fetch(`${api.baseURL}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Try to get user profile from a lightweight endpoint
        const statusResponse = await api.getSubscriptionStatus().catch(() => null);
        return {
          user: {
            plan: statusResponse?.data?.plan || 'free',
            planExpiresAt: statusResponse?.data?.planExpiresAt || null,
            currency: 'UGX',
          }
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Initialize the main application layout
   */
  initApp() {
    const app = document.getElementById('app');
    if (!app) return;

    // Build the main layout
    app.innerHTML = `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <img src="assets/img/logo.svg" alt="FlowSmart">
          <span class="logo-text">FlowSmart</span>
        </div>
        <nav class="sidebar-nav" id="sidebarNav"></nav>
        <div class="sidebar-footer" id="sidebarFooter"></div>
      </aside>
      
      <header class="topbar" id="topbar">
        <div class="topbar-left">
          <button class="hamburger" id="sidebarToggle" aria-label="Toggle sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 class="page-title" id="pageTitle">Dashboard</h1>
        </div>
        <div class="topbar-right">
          <div class="currency-toggle">
            <button class="currency-btn active" data-currency="UGX">UGX</button>
            <button class="currency-btn" data-currency="USD">USD</button>
          </div>
          <button class="btn btn-ghost btn-sm" id="themeToggle">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          </button>
          <div class="user-menu" id="userMenu"></div>
        </div>
      </header>
      
      <main class="main-content" id="mainContent">
        <div class="page-content" id="pageContent"></div>
      </main>
      
      <nav class="mobile-nav" id="mobileNav"></nav>
      
      <div class="toast-container" id="toastContainer"></div>
    `;

    // Initialize components
    Sidebar.init();
    Topbar.init();
    Router.init();
    
    // Event listeners
    this.setupEventListeners();
  },

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Currency toggle
    document.querySelectorAll('.currency-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const currency = btn.dataset.currency;
        this.setCurrency(currency);
      });
    });
  },

  /**
   * Toggle between dark and light theme
   */
  toggleTheme() {
    const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.state.theme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('flowsmart-theme', newTheme);
    this.emit('themeChanged', newTheme);
  },

  /**
   * Set currency
   */
  setCurrency(currency) {
    if (this.state.currency === currency) return;
    this.state.currency = currency;
    
    // Update UI
    document.querySelectorAll('.currency-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.currency === currency);
    });
    
    this.emit('currencyChanged', currency);
  },

  /**
   * Logout
   */
  async logout() {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    this.state.isAuthenticated = false;
    this.state.user = null;
    window.location.href = '/login.html';
  },

  /**
   * Subscribe to state changes
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  },

  /**
   * Emit event
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  },
};
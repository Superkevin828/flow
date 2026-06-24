/**
 * Hash-based router — works on ANY static server including python -m http.server
 * URLs look like: index.html#dashboard, index.html#transactions etc.
 */
const Router = {
  routes: {
    'dashboard':    { title: 'Dashboard',    module: 'Dashboard' },
    'transactions': { title: 'Transactions', module: 'Transactions' },
    'forecast':     { title: 'AI Forecast',  module: 'Forecast' },
    'reports':      { title: 'Reports',      module: 'Reports' },
    'invoices':     { title: 'Invoices',     module: 'Invoices' },
    'settings':     { title: 'Settings',     module: 'Settings' },
  },

  currentRoute: null,

  init() {
    // Navigate to current hash on load, default to dashboard
    const hash = this.getHash();
    this.navigateTo(hash);

    // Handle hash changes (back/forward, anchor clicks)
    window.addEventListener('hashchange', () => {
      const newHash = this.getHash();
      this.navigateTo(newHash);
    });

    // Handle sidebar / mobile nav button clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (link) {
        e.preventDefault();
        this.navigate(link.dataset.route);
      }
    });
  },

  getHash() {
    const hash = window.location.hash.replace('#', '').trim();
    return (hash && this.routes[hash]) ? hash : 'dashboard';
  },

  navigate(route) {
    // Setting location.hash triggers hashchange → navigateTo
    window.location.hash = route;
  },

  async navigateTo(route) {
    if (this.currentRoute === route) return;

    const routeConfig = this.routes[route] || this.routes['dashboard'];
    const moduleName = routeConfig.module;

    // Update page title
    document.title = `${routeConfig.title} - FlowSmart`;
    const pageTitleEl = document.getElementById('pageTitle');
    if (pageTitleEl) pageTitleEl.textContent = routeConfig.title;

    // Show skeleton while page loads
    const content = document.getElementById('pageContent');
    if (content && typeof Skeleton !== 'undefined') {
      Skeleton.show(content);
    }

    // Init page module
    const pageModule = window[`${moduleName}Page`];
    if (pageModule && typeof pageModule.init === 'function') {
      await pageModule.init();
    }

    // Update sidebar & mobile nav active states
    if (typeof Sidebar !== 'undefined') Sidebar.setActive(route);
    this.updateMobileNav(route);

    this.currentRoute = route;
    FlowSmart.state.currentRoute = route;
  },

  updateMobileNav(route) {
    const mobileNav = document.getElementById('mobileNav');
    if (!mobileNav) return;

    const items = [
      { route: 'dashboard',    icon: 'home',     label: 'Home' },
      { route: 'transactions', icon: 'list',     label: 'Txns' },
      { route: 'forecast',     icon: 'trending', label: 'Forecast' },
      { route: 'reports',      icon: 'chart',    label: 'Reports' },
      { route: 'settings',     icon: 'settings', label: 'Settings' },
    ];

    mobileNav.innerHTML = `
      <div class="mobile-nav-items">
        ${items.map(item => `
          <button class="mobile-nav-item ${route === item.route ? 'active' : ''}"
                  data-route="${item.route}">
            ${this.getIcon(item.icon)}
            <span>${item.label}</span>
          </button>
        `).join('')}
      </div>
    `;
  },

  getIcon(name) {
    const icons = {
      home:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
      list:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
      trending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
      chart:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path></svg>',
      settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    };
    return icons[name] || '';
  },
};
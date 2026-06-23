/**
 * Client-side SPA Router
 */
const Router = {
  routes: {
    '/dashboard':    { title: 'Dashboard',    module: 'Dashboard' },
    '/transactions': { title: 'Transactions',  module: 'Transactions' },
    '/forecast':     { title: 'AI Forecast',   module: 'Forecast' },
    '/reports':      { title: 'Reports',       module: 'Reports' },
    '/invoices':     { title: 'Invoices',      module: 'Invoices' },
    '/settings':     { title: 'Settings',      module: 'Settings' },
  },

  currentRoute: null,

  init() {
    // Handle initial route
    const path = window.location.pathname;
    const route = this.getRouteFromPath(path);
    
    // Update page title
    this.updatePageTitle(route);
    
    // Navigate to route
    this.navigateTo(route);

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      const newPath = window.location.pathname;
      const newRoute = this.getRouteFromPath(newPath);
      this.navigateTo(newRoute, false);
    });

    // Handle link clicks (delegate from main content)
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (link) {
        e.preventDefault();
        const route = link.dataset.route;
        this.navigate(route);
      }
    });
  },

  getRouteFromPath(path) {
    // Normalize path
    if (path === '/' || path === '') return '/dashboard';
    if (path.startsWith('/')) {
      const base = '/' + path.split('/')[1];
      if (this.routes[base]) return base;
    }
    return '/dashboard';
  },

  navigate(route) {
    window.history.pushState({}, '', route);
    this.navigateTo(route, true);
  },

  async navigateTo(route, updateHistory = true) {
    if (this.currentRoute === route) return;

    // Update page title
    this.updatePageTitle(route);

    // Show loading state
    const content = document.getElementById('pageContent');
    if (content) {
      Skeleton.show(content);
    }

    // Load page module
    const routeConfig = this.routes[route] || this.routes['/dashboard'];
    const moduleName = routeConfig.module;
    
    // Initialize the page
    const pageModule = window[`${moduleName}Page`];
    if (pageModule && pageModule.init) {
      await pageModule.init();
    }

    // Update sidebar active state
    Sidebar.setActive(route);
    
    // Update mobile nav
    this.updateMobileNav(route);

    this.currentRoute = route;
    FlowSmart.state.currentRoute = route;
  },

  updatePageTitle(route) {
    const routeConfig = this.routes[route];
    const title = routeConfig ? routeConfig.title : 'Dashboard';
    document.title = `${title} - FlowSmart`;
    
    const pageTitleEl = document.getElementById('pageTitle');
    if (pageTitleEl) {
      pageTitleEl.textContent = title;
    }
  },

  updateMobileNav(route) {
    const mobileNav = document.getElementById('mobileNav');
    if (!mobileNav) return;

    const items = [
      { route: '/dashboard',    icon: 'home',      label: 'Home' },
      { route: '/transactions', icon: 'list',      label: 'Transactions' },
      { route: '/forecast',     icon: 'trending',  label: 'Forecast' },
      { route: '/reports',      icon: 'chart',     label: 'Reports' },
      { route: '/settings',     icon: 'settings',  label: 'Settings' },
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
      home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
      list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
      trending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
      chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path></svg>',
      settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    };
    return icons[name] || '';
  },
};
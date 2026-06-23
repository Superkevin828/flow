/**
 * Sidebar component
 */
const Sidebar = {
  navItems: [
    { route: '/dashboard',    icon: 'home',      label: 'Dashboard' },
    { route: '/transactions', icon: 'list',      label: 'Transactions' },
    { route: '/forecast',     icon: 'trending',  label: 'AI Forecast' },
    { route: '/reports',      icon: 'chart',     label: 'Reports' },
    { route: '/invoices',     icon: 'file',      label: 'Invoices',    pro: true },
    { route: '/settings',     icon: 'settings',  label: 'Settings' },
  ],

  icons: {
    home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
    list: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
    trending: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
    chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path></svg>',
    file: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
    settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
  },

  init() {
    this.render();
    this.setupListeners();
  },

  render() {
    const nav = document.getElementById('sidebarNav');
    const footer = document.getElementById('sidebarFooter');
    if (!nav) return;

    const isPro = FlowSmart.state.user?.plan === 'pro';
    const planExpiresAt = FlowSmart.state.user?.planExpiresAt;

    nav.innerHTML = this.navItems.map(item => {
      const proBadge = item.pro ? '<span class="nav-badge badge badge-green">Pro</span>' : '';
      return `
        <a href="${item.route}" class="nav-item" data-route="${item.route}">
          <span class="nav-icon">${this.icons[item.icon]}</span>
          <span class="nav-label">${item.label}</span>
          ${proBadge}
        </a>
      `;
    }).join('');

    // Footer - Plan status
    if (footer) {
      const daysLeft = planExpiresAt 
        ? Math.ceil((new Date(planExpiresAt) - new Date()) / (1000 * 60 * 60 * 24))
        : null;
      
      footer.innerHTML = `
        <div style="padding: 8px;">
          <div class="badge ${isPro ? 'badge-green' : 'badge-gray'}" style="width: 100%; justify-content: center; padding: 8px;">
            ${isPro ? `Pro Plan • ${daysLeft > 0 ? daysLeft + ' days left' : 'Expired'}` : 'Free Plan'}
          </div>
          ${!isPro ? `
            <button class="btn btn-primary btn-sm btn-full" style="margin-top: 8px;" onclick="FlowSmart.navigate('/settings')">
              Upgrade to Pro
            </button>
          ` : ''}
        </div>
      `;
    }
  },

  setupListeners() {
    // Sidebar toggle
    const toggleBtn = document.getElementById('sidebarToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
      });
    }

    // Navigation items
    document.querySelectorAll('.nav-item[data-route]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = item.dataset.route;
        Router.navigate(route);
      });
    });
  },

  setActive(route) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === route);
    });
  },
};
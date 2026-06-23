/**
 * Topbar component
 */
const Topbar = {
  init() {
    this.setupUserMenu();
  },

  setupUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (!userMenu) return;

    const user = FlowSmart.state.user;
    if (!user) return;

    userMenu.innerHTML = `
      <div class="user-menu-trigger" id="userMenuTrigger">
        <div class="user-avatar">
          ${(user.name || 'U').charAt(0).toUpperCase()}
        </div>
        <span class="user-name">${user.name || 'User'}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 8L1 3h10z"/>
        </svg>
      </div>
      <div class="user-dropdown hidden" id="userDropdown">
        <a href="/settings" class="dropdown-item" data-route="/settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Settings
        </a>
        <hr class="dropdown-divider">
        <button class="dropdown-item" onclick="FlowSmart.logout()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Sign out
        </button>
      </div>
    `;

    // Toggle dropdown
    const trigger = document.getElementById('userMenuTrigger');
    const dropdown = document.getElementById('userDropdown');
    
    trigger.addEventListener('click', () => {
      dropdown.classList.toggle('hidden');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!userMenu.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  },
};
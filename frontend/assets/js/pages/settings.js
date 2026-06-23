/**
 * Settings page
 */
const SettingsPage = {
  async init() {
    const content = document.getElementById('pageContent');
    if (!content) return;

    const user = FlowSmart.state.user || {};
    const isPro = user.plan === 'pro';

    content.innerHTML = `
      <div style="max-width:640px;">
        <h2 style="font-size:1.5rem; font-weight:700; margin-bottom:24px;">Settings</h2>

        <!-- Profile -->
        <div class="card" style="margin-bottom:20px;">
          <div class="card-header"><h3 class="card-title">Profile</h3></div>
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="settingName" class="form-input" value="${user.name || ''}">
          </div>
          <div class="form-group">
            <label>Business Name</label>
            <input type="text" id="settingBusiness" class="form-input" value="${user.businessName || ''}">
          </div>
          <div class="form-group">
            <label>Default Currency</label>
            <select id="settingCurrency" class="form-select">
              <option value="UGX" ${FlowSmart.state.currency === 'UGX' ? 'selected' : ''}>UGX - Ugandan Shilling</option>
              <option value="USD" ${FlowSmart.state.currency === 'USD' ? 'selected' : ''}>USD - US Dollar</option>
            </select>
          </div>
          <button class="btn btn-primary" id="saveProfileBtn">Save Changes</button>
        </div>

        <!-- Change Password -->
        <div class="card" style="margin-bottom:20px;">
          <div class="card-header"><h3 class="card-title">Change Password</h3></div>
          <div class="form-group">
            <label>Current Password</label>
            <input type="password" id="currentPassword" class="form-input" placeholder="••••••••">
          </div>
          <div class="form-group">
            <label>New Password</label>
            <input type="password" id="newPassword" class="form-input" placeholder="Minimum 8 characters">
          </div>
          <div class="form-group">
            <label>Confirm New Password</label>
            <input type="password" id="confirmNewPassword" class="form-input" placeholder="Re-enter new password">
          </div>
          <button class="btn btn-primary" id="changePasswordBtn">Update Password</button>
        </div>

        <!-- Subscription -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Subscription</h3>
            <span class="badge ${isPro ? 'badge-green' : 'badge-gray'}">${isPro ? 'Pro' : 'Free'}</span>
          </div>
          ${isPro ? `
            <p style="color:var(--color-text-muted); margin-bottom:16px;">
              Your Pro plan ${user.planExpiresAt 
                ? 'expires on ' + Utils.formatDate(user.planExpiresAt) 
                : 'is active'}.
            </p>
          ` : `
            <p style="color:var(--color-text-muted); margin-bottom:16px;">
              Upgrade to Pro to unlock AI forecasting, invoicing, and advanced reports.
            </p>
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
              <button class="btn btn-primary" id="subscribeMonthlyBtn">Monthly — $9.99/mo</button>
              <button class="btn btn-secondary" id="subscribeYearlyBtn">Yearly — $89.99/yr (save 25%)</button>
            </div>
          `}
        </div>
      </div>
    `;

    this.setupListeners();
  },

  setupListeners() {
    document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
      const name = document.getElementById('settingName').value.trim();
      const businessName = document.getElementById('settingBusiness').value.trim();
      const currency = document.getElementById('settingCurrency').value;

      try {
        await api.updateProfile({ name, businessName, currency });
        FlowSmart.state.user.name = name;
        FlowSmart.setCurrency(currency);
        Toast.success('Profile updated');
      } catch (error) {
        Toast.error(error.message);
      }
    });

    document.getElementById('changePasswordBtn')?.addEventListener('click', async () => {
      const current = document.getElementById('currentPassword').value;
      const newPwd = document.getElementById('newPassword').value;
      const confirm = document.getElementById('confirmNewPassword').value;

      if (newPwd.length < 8) {
        Toast.error('New password must be at least 8 characters');
        return;
      }
      if (newPwd !== confirm) {
        Toast.error('Passwords do not match');
        return;
      }

      try {
        await api.changePassword(current, newPwd);
        Toast.success('Password updated');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
      } catch (error) {
        Toast.error(error.message);
      }
    });

    document.getElementById('subscribeMonthlyBtn')?.addEventListener('click', () => {
      this.initiateSubscription('monthly');
    });

    document.getElementById('subscribeYearlyBtn')?.addEventListener('click', () => {
      this.initiateSubscription('yearly');
    });
  },

  async initiateSubscription(billingCycle) {
    try {
      const response = await api.initiateSubscription(billingCycle);
      if (response.data?.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      }
    } catch (error) {
      Toast.error(error.message);
    }
  },
};

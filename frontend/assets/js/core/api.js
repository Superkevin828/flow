/**
 * FlowSmart API Client
 * Uses CONFIG.API_BASE_URL from config.js — change it there, not here.
 */
class APIClient {
  constructor() {
    // Single source of truth: assets/js/core/config.js
    this.baseURL = CONFIG.API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      credentials: 'include',
    };

    let response;
    try {
      response = await fetch(url, config);
    } catch (err) {
      throw new APIError(
        `Cannot reach server at ${this.baseURL}. Is the backend running?`,
        0
      );
    }

    // Auto-refresh on 401
    if (response.status === 401) {
      const refreshed = await this._refreshToken();
      if (refreshed) {
        try { response = await fetch(url, config); } catch {
          throw new APIError('Session expired. Please log in again.', 401);
        }
      } else {
        window.location.href = 'login.html';
        throw new APIError('Session expired. Please log in again.', 401);
      }
    }

    if (!response.ok) {
      let errData = {};
      try { errData = await response.json(); } catch {}
      throw new APIError(
        errData.message || `Server error (${response.status})`,
        response.status,
        errData
      );
    }

    if (response.status === 204) return { success: true };
    return response.json();
  }

  async _refreshToken() {
    try {
      const r = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST', credentials: 'include',
      });
      return r.ok;
    } catch { return false; }
  }

  // ── Auth ──────────────────────────────────────────────────────────────
  login(email, password) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  }
  register(data) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }
  logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }
  updateProfile(data) {
    return this.request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });
  }
  changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
  }

  // ── Transactions ──────────────────────────────────────────────────────
  getTransactions(params = {}) {
    return this.request(`/transactions?${new URLSearchParams(params)}`);
  }
  createTransaction(data) {
    return this.request('/transactions', { method: 'POST', body: JSON.stringify(data) });
  }
  updateTransaction(id, data) {
    return this.request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  deleteTransaction(id) {
    return this.request(`/transactions/${id}`, { method: 'DELETE' });
  }
  importTransactions(transactions) {
    return this.request('/transactions/import', { method: 'POST', body: JSON.stringify({ transactions }) });
  }

  // ── Reports ───────────────────────────────────────────────────────────
  getSummary()            { return this.request('/reports/summary'); }
  getMonthlyReport(month) { return this.request(`/reports/monthly?month=${month}`); }
  getAnnualReport(year)   { return this.request(`/reports/annual?year=${year}`); }

  // ── AI ────────────────────────────────────────────────────────────────
  generateForecast() { return this.request('/ai/forecast',  { method: 'POST' }); }
  generateInsights() { return this.request('/ai/insights',  { method: 'POST' }); }

  // ── Invoices ──────────────────────────────────────────────────────────
  getInvoices(params = {}) {
    return this.request(`/invoices?${new URLSearchParams(params)}`);
  }
  createInvoice(data)     { return this.request('/invoices', { method: 'POST', body: JSON.stringify(data) }); }
  updateInvoice(id, data) { return this.request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  deleteInvoice(id)       { return this.request(`/invoices/${id}`, { method: 'DELETE' }); }
  markInvoicePaid(id)     { return this.request(`/invoices/${id}/mark-paid`, { method: 'POST' }); }
  sendInvoice(id)         { return this.request(`/invoices/${id}/send`, { method: 'POST' }); }

  // ── Subscriptions ─────────────────────────────────────────────────────
  getSubscriptionStatus() { return this.request('/subscriptions/status'); }
  initiateSubscription(cycle) {
    return this.request('/subscriptions/initiate', { method: 'POST', body: JSON.stringify({ billingCycle: cycle }) });
  }
}

class APIError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name   = 'APIError';
    this.status = status;
    this.data   = data;
  }
}

const api = new APIClient();
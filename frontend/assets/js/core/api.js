/**
 * FlowSmart API Client
 * Handles all HTTP requests to the backend
 */
class APIClient {
  constructor() {
    this.baseURL = window.location.hostname === 'localhost' 
      ? 'http://localhost:5000/api' 
      : 'https://flowsmart-api.onrender.com/api';
  }

  /**
   * Make API request with automatic token refresh
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Send cookies
    };

    try {
      let response = await fetch(url, config);

      // Handle token expiration
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.code === 'TOKEN_EXPIRED') {
          // Try to refresh token
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the original request
            response = await fetch(url, config);
          } else {
            // Redirect to login
            window.location.href = '/login.html';
            throw new Error('Session expired. Please login again.');
          }
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'An unexpected error occurred'
        }));
        throw new APIError(error.message, response.status, error);
      }

      // Handle no content
      if (response.status === 204) {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      
      // Network error
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new APIError('Network error. Please check your connection.', 0);
      }
      
      throw new APIError(error.message || 'Request failed', 500);
    }
  }

  /**
   * Refresh the access token
   */
  async refreshToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Transactions
  async getTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/transactions?${query}`);
  }

  async createTransaction(data) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id, data) {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id) {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  async importTransactions(transactions) {
    return this.request('/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    });
  }

  // Reports
  async getSummary() {
    return this.request('/reports/summary');
  }

  async getMonthlyReport(month) {
    return this.request(`/reports/monthly?month=${month}`);
  }

  async getAnnualReport(year) {
    return this.request(`/reports/annual?year=${year}`);
  }

  // AI
  async generateForecast() {
    return this.request('/ai/forecast', { method: 'POST' });
  }

  async generateInsights() {
    return this.request('/ai/insights', { method: 'POST' });
  }

  // Invoices
  async getInvoices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/invoices?${query}`);
  }

  async createInvoice(data) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInvoice(id, data) {
    return this.request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInvoice(id) {
    return this.request(`/invoices/${id}`, {
      method: 'DELETE',
    });
  }

  async markInvoicePaid(id) {
    return this.request(`/invoices/${id}/mark-paid`, {
      method: 'POST',
    });
  }

  async sendInvoice(id) {
    return this.request(`/invoices/${id}/send`, {
      method: 'POST',
    });
  }

  // Subscriptions
  async getSubscriptionStatus() {
    return this.request('/subscriptions/status');
  }

  async initiateSubscription(billingCycle) {
    return this.request('/subscriptions/initiate', {
      method: 'POST',
      body: JSON.stringify({ billingCycle }),
    });
  }
}

// Custom API Error class
class APIError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// Create singleton instance
const api = new APIClient();
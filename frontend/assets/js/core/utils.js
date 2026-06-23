/**
 * Utility functions for FlowSmart
 */
const Utils = {
  /**
   * Format currency amount
   */
  formatCurrency(amount, currency = FlowSmart.state.currency) {
    const symbols = { UGX: 'USh', USD: '$' };
    const symbol = symbols[currency] || currency;
    
    if (currency === 'UGX') {
      return `${symbol} ${Math.round(amount).toLocaleString()}`;
    }
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  /**
   * Format date
   */
  formatDate(date, format = 'short') {
    const d = dayjs(date);
    switch (format) {
      case 'short':
        return d.format('MMM D, YYYY');
      case 'long':
        return d.format('MMMM D, YYYY');
      case 'time':
        return d.format('MMM D, YYYY h:mm A');
      case 'month':
        return d.format('MMMM YYYY');
      case 'relative':
        return this.timeAgo(date);
      default:
        return d.format(format);
    }
  },

  /**
   * Time ago string
   */
  timeAgo(date) {
    const now = dayjs();
    const d = dayjs(date);
    const diff = now.diff(d, 'minute');
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    if (diff < 43200) return `${Math.floor(diff / 1440)}d ago`;
    return d.format('MMM D, YYYY');
  },

  /**
   * Truncate text
   */
  truncate(text, length = 50) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  },

  /**
   * Generate random ID
   */
  generateId(prefix = '') {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Debounce function
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function
   */
  throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Parse CSV file
   */
  parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results),
        error: (error) => reject(error),
      });
    });
  },

  /**
   * Download file
   */
  downloadFile(content, filename, type = 'text/csv') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Get query parameter
   */
  getQueryParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
  },

  /**
   * Set query parameter
   */
  setQueryParam(param, value) {
    const params = new URLSearchParams(window.location.search);
    params.set(param, value);
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  },

  /**
   * Get percentage change
   */
  getPercentChange(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  },

  /**
   * Clamp number
   */
  clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  },

  /**
   * Add ordinals
   */
  ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  },
};
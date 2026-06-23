/**
 * Chart.js wrapper for FlowSmart
 */
const ChartHelper = {
  charts: {},

  /**
   * Create a line chart
   */
  createLineChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // Destroy existing chart
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');
    
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim(),
            font: { family: 'Inter', size: 12 },
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          borderColor: '#1f2d45',
          borderWidth: 1,
          padding: 12,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim(),
            font: { size: 11 },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(31, 45, 69, 0.5)',
          },
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim(),
            font: { size: 11 },
            callback: (value) => Utils.formatCurrency(value),
          },
        },
      },
    };

    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data,
      options: { ...defaultOptions, ...options },
    });

    return this.charts[canvasId];
  },

  /**
   * Create a bar chart
   */
  createBarChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');
    const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim();
    
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textMuted,
            font: { family: 'Inter', size: 12 },
            padding: 20,
            usePointStyle: true,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textMuted, font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(31, 45, 69, 0.5)' },
          ticks: {
            color: textMuted,
            font: { size: 11 },
            callback: (value) => Utils.formatCurrency(value),
          },
        },
      },
    };

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data,
      options: { ...defaultOptions, ...options },
    });

    return this.charts[canvasId];
  },

  /**
   * Create a doughnut chart
   */
  createDoughnutChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');
    const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim();
    
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: textMuted,
            font: { family: 'Inter', size: 11 },
            padding: 16,
            usePointStyle: true,
          },
        },
      },
    };

    this.charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data,
      options: { ...defaultOptions, ...options },
    });

    return this.charts[canvasId];
  },

  /**
   * Destroy all charts
   */
  destroyAll() {
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
        delete this.charts[key];
      }
    });
  },
};
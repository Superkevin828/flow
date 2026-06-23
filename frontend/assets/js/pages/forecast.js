/**
 * AI Forecast page
 */
const ForecastPage = {
  async init() {
    const content = document.getElementById('pageContent');
    if (!content) return;

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h2 style="font-size:1.5rem; font-weight:700; margin-bottom:4px;">AI Cash Flow Forecast</h2>
          <p style="color:var(--color-text-muted)">Predict your next 30 days based on historical transactions</p>
        </div>
        <button class="btn btn-primary" id="generateForecastBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
          Generate Forecast
        </button>
      </div>

      <div id="forecastContent">
        <div class="card" style="text-align:center; padding:60px 20px;">
          <div style="font-size:3rem; margin-bottom:16px;">📈</div>
          <h3 style="margin-bottom:8px;">Generate Your AI Forecast</h3>
          <p style="color:var(--color-text-muted); margin-bottom:24px;">
            Click the button above to get a 30-day cash flow prediction powered by AI.
          </p>
        </div>
      </div>
    `;

    document.getElementById('generateForecastBtn')?.addEventListener('click', () => {
      this.generateForecast();
    });
  },

  async generateForecast() {
    const content = document.getElementById('forecastContent');
    if (!content) return;

    content.innerHTML = '<div class="skeleton" style="height:400px; border-radius:var(--radius-lg);"></div>';

    try {
      const response = await api.generateForecast();

      if (response.success) {
        const forecast = response.data;
        content.innerHTML = `
          <div class="card" style="margin-bottom:24px;">
            <div class="card-header">
              <h3 class="card-title">30-Day Forecast</h3>
              <span class="badge badge-green">AI Generated</span>
            </div>
            <div class="chart-container">
              <canvas id="forecastChart"></canvas>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Forecast Summary</h3>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px;">
              <div class="kpi-card">
                <div class="kpi-label">Projected Revenue</div>
                <div class="kpi-value">${Utils.formatCurrency(forecast.projectedRevenue)}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Projected Expenses</div>
                <div class="kpi-value">${Utils.formatCurrency(forecast.projectedExpenses)}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Projected Net</div>
                <div class="kpi-value ${forecast.projectedNet >= 0 ? 'text-green' : 'text-red'}">
                  ${Utils.formatCurrency(forecast.projectedNet)}
                </div>
              </div>
            </div>
            ${forecast.advice ? `
              <div class="alert alert-info" style="margin-top:16px;">
                💡 ${forecast.advice}
              </div>
            ` : ''}
          </div>
        `;

        if (forecast.dailyProjections) {
          const chartData = {
            labels: forecast.dailyProjections.map(d => d.date),
            datasets: [{
              label: 'Projected Cash Flow',
              data: forecast.dailyProjections.map(d => d.amount),
              borderColor: '#22c55e',
              backgroundColor: 'rgba(34,197,94,0.1)',
              fill: true,
              tension: 0.4,
              borderDash: [5, 5],
            }],
          };
          ChartHelper.createLineChart('forecastChart', chartData);
        }
      } else {
        content.innerHTML = `
          <div class="card" style="text-align:center; padding:40px;">
            <p style="color:var(--color-text-muted);">Upgrade to Pro to access AI forecasting.</p>
            <button class="btn btn-primary" style="margin-top:16px;" 
                    onclick="Router.navigate('/settings')">Upgrade Now</button>
          </div>
        `;
      }
    } catch (error) {
      if (error.status === 403) {
        content.innerHTML = `
          <div class="card" style="text-align:center; padding:40px;">
            <p style="color:var(--color-text-muted);">Upgrade to Pro to access AI forecasting.</p>
            <button class="btn btn-primary" style="margin-top:16px;"
                    onclick="Router.navigate('/settings')">Upgrade Now</button>
          </div>
        `;
      } else {
        Toast.error('Failed to generate forecast: ' + error.message);
        content.innerHTML = `<div class="card"><p class="text-muted">Failed to generate forecast. Please try again.</p></div>`;
      }
    }
  },
};

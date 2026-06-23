/**
 * Dashboard page
 */
const DashboardPage = {
  async init() {
    const content = document.getElementById('pageContent');
    if (!content) return;

    content.innerHTML = `
      <div id="alertBanner" class="hidden"></div>

      <div class="kpi-grid" id="kpiGrid">
        ${Array(4).fill('<div class="kpi-card skeleton" style="height: 120px;"></div>').join('')}
      </div>

      <div class="charts-row">
        <div class="card chart-card">
          <div class="card-header">
            <h3 class="card-title">Cash Flow</h3>
            <div class="chart-toggles">
              <button class="btn btn-ghost btn-sm active" data-period="30">30 Days</button>
              <button class="btn btn-ghost btn-sm" data-period="90">90 Days</button>
              <button class="btn btn-ghost btn-sm" data-period="180">180 Days</button>
            </div>
          </div>
          <div class="chart-container" id="cashFlowChartContainer">
            <canvas id="cashFlowChart"></canvas>
          </div>
        </div>
        
        <div class="card chart-card">
          <div class="card-header">
            <h3 class="card-title">Income vs Expenses</h3>
          </div>
          <div class="chart-container" id="incomeExpenseChartContainer">
            <canvas id="incomeExpenseChart"></canvas>
          </div>
        </div>
      </div>

      <div class="card insights-panel" id="insightsPanel">
        <div class="card-header">
          <h3 class="card-title">🤖 AI Insights</h3>
          <button class="btn btn-ghost btn-sm" id="refreshInsights">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Refresh
          </button>
        </div>
        <div id="insightsContent">
          <div class="skeleton" style="height: 100px;"></div>
        </div>
      </div>
    `;

    await this.loadDashboard();

    document.querySelectorAll('.chart-toggles .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.chart-toggles .btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.updateCashFlowChart(parseInt(btn.dataset.period));
      });
    });

    document.getElementById('refreshInsights')?.addEventListener('click', () => {
      this.loadInsights();
    });
  },

  async loadDashboard() {
    try {
      const summaryResponse = await api.getSummary();
      if (summaryResponse.success) {
        this.renderKPIs(summaryResponse.data);
        this.renderAlerts(summaryResponse.data);
        this.renderIncomeExpenseChart(summaryResponse.data);
      }

      await this.updateCashFlowChart(30);
      await this.loadInsights();
    } catch (error) {
      console.error('Dashboard load error:', error);
      Toast.error('Failed to load dashboard data');
    }
  },

  renderKPIs(data) {
    const kpiGrid = document.getElementById('kpiGrid');
    if (!kpiGrid) return;

    // FIX #7: Use real percentage change from API data instead of hardcoded '+12.5%'
    const revenueChange = data.revenuePrevious
      ? Utils.getPercentChange(data.totalRevenue, data.revenuePrevious)
      : null;
    const revenueChangeLabel = revenueChange !== null
      ? `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}% vs last period`
      : 'No previous data';
    const revenueTrend = revenueChange === null ? 'neutral' : revenueChange >= 0 ? 'positive' : 'negative';

    const kpis = [
      {
        label: 'Total Revenue (30d)',
        value: Utils.formatCurrency(data.totalRevenue),
        change: revenueChangeLabel,
        trend: revenueTrend,
      },
      {
        label: 'Total Expenses (30d)',
        value: Utils.formatCurrency(data.totalExpenses),
        change: data.netCashFlow < 0 ? 'Watch spending' : 'On track',
        trend: data.netCashFlow < 0 ? 'negative' : 'neutral',
      },
      {
        label: 'Net Cash Flow',
        value: Utils.formatCurrency(data.netCashFlow),
        change: data.netCashFlow >= 0 ? 'Positive' : 'Negative',
        trend: data.netCashFlow >= 0 ? 'positive' : 'negative',
      },
      {
        label: 'Cash Runway',
        value: `${data.cashRunway ?? '—'} days`,
        change: !data.cashRunway ? 'No data'
          : data.cashRunway < 14 ? 'Critical'
          : data.cashRunway < 30 ? 'Low' : 'Healthy',
        trend: !data.cashRunway ? 'neutral'
          : data.cashRunway < 14 ? 'negative'
          : data.cashRunway < 30 ? 'neutral' : 'positive',
      },
    ];

    kpiGrid.innerHTML = kpis.map(kpi => `
      <div class="kpi-card">
        <div class="kpi-label">${kpi.label}</div>
        <div class="kpi-value">${kpi.value}</div>
        <div class="kpi-change ${kpi.trend}">${kpi.change}</div>
      </div>
    `).join('');
  },

  renderAlerts(data) {
    const banner = document.getElementById('alertBanner');
    if (!banner) return;

    const alerts = [];
    
    if (data.cashRunway < 14) {
      alerts.push({ type: 'danger', message: `⚠️ Critical: Only ${data.cashRunway} days of cash runway remaining.` });
    } else if (data.cashRunway < 30) {
      alerts.push({ type: 'warning', message: `⚡ Low cash runway: ${data.cashRunway} days. Consider reducing expenses.` });
    }

    if (data.netCashFlow < 0) {
      alerts.push({ type: 'warning', message: '📉 Negative cash flow detected. Expenses exceed income this month.' });
    }

    if (alerts.length > 0) {
      banner.innerHTML = alerts.map(a => `<div class="alert alert-${a.type}">${a.message}</div>`).join('');
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  },

  renderIncomeExpenseChart(data) {
    if (!data.monthlyBreakdown) return;
    const months = data.monthlyBreakdown.map(m => m.month);
    const chartData = {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: data.monthlyBreakdown.map(m => m.income),
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
        },
        {
          label: 'Expenses',
          data: data.monthlyBreakdown.map(m => m.expenses),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
        },
      ],
    };
    ChartHelper.createBarChart('incomeExpenseChart', chartData);
  },

  async updateCashFlowChart(period) {
    try {
      const params = {
        limit: 200,
        from: dayjs().subtract(period, 'day').toISOString(),
        to: new Date().toISOString(),
      };
      const response = await api.getTransactions(params);
      if (!response.success) return;

      const transactions = response.data.transactions;
      
      const dailyData = {};
      transactions.forEach(t => {
        const date = dayjs(t.date).format('MMM D');
        if (!dailyData[date]) dailyData[date] = { income: 0, expense: 0 };
        if (t.type === 'income') dailyData[date].income += t.amount;
        else dailyData[date].expense += t.amount;
      });

      const sortedDates = Object.keys(dailyData).sort((a, b) =>
        dayjs(a).isAfter(dayjs(b)) ? 1 : -1
      );

      const chartData = {
        labels: sortedDates,
        datasets: [
          {
            label: 'Net Cash Flow',
            data: sortedDates.map(d => dailyData[d].income - dailyData[d].expense),
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      };

      ChartHelper.createLineChart('cashFlowChart', chartData);
    } catch (error) {
      console.error('Chart update error:', error);
    }
  },

  async loadInsights() {
    const content = document.getElementById('insightsContent');
    if (!content) return;

    try {
      const response = await api.generateInsights();
      
      if (response.success) {
        content.innerHTML = `
          <ul class="insights-list">
            ${response.data.insights.map(insight => `
              <li class="insight-item">
                <span class="insight-icon">💡</span>
                <span>${insight}</span>
              </li>
            `).join('')}
          </ul>
          <div class="insights-footer">
            <span class="insights-generated">Generated ${Utils.timeAgo(response.data.generatedAt)}</span>
          </div>
        `;
      } else {
        content.innerHTML = '<p class="text-muted">Upgrade to Pro for AI-powered insights.</p>';
      }
    } catch (error) {
      if (error.status === 403) {
        content.innerHTML = '<p class="text-muted">Upgrade to Pro for AI-powered insights.</p>';
      } else {
        content.innerHTML = '<p class="text-muted">Unable to load insights at this time.</p>';
      }
    }
  },
};

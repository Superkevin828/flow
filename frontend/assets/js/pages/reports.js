/**
 * Reports page
 */
const ReportsPage = {
  async init() {
    const content = document.getElementById('pageContent');
    if (!content) return;

    const currentMonth = dayjs().format('YYYY-MM');

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h2 style="font-size:1.5rem; font-weight:700; margin-bottom:4px;">Reports</h2>
          <p style="color:var(--color-text-muted)">Monthly and annual financial summaries</p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <input type="month" id="monthPicker" class="form-input" value="${currentMonth}" style="width:180px;">
          <button class="btn btn-primary" id="loadReportBtn">Load Report</button>
          <button class="btn btn-secondary" id="exportPDFBtn">Export PDF</button>
        </div>
      </div>
      <div id="reportContent">
        <div class="skeleton" style="height:400px; border-radius:var(--radius-lg);"></div>
      </div>
    `;

    document.getElementById('loadReportBtn')?.addEventListener('click', () => {
      this.loadMonthlyReport(document.getElementById('monthPicker').value);
    });
    document.getElementById('exportPDFBtn')?.addEventListener('click', () => {
      Toast.info('PDF export coming soon.');
    });

    await this.loadMonthlyReport(currentMonth);
  },

  async loadMonthlyReport(month) {
    const content = document.getElementById('reportContent');
    if (!content) return;

    content.innerHTML = '<div class="skeleton" style="height:400px; border-radius:var(--radius-lg);"></div>';

    try {
      const response = await api.getMonthlyReport(month);

      if (response.success) {
        const data = response.data;
        // FIX: API returns netIncome not netProfit
        const net = data.netIncome ?? 0;
        // FIX: API returns expenseByCategory (object), build array for chart
        const expCats = data.expenseByCategory
          ? Object.entries(data.expenseByCategory)
              .map(([category, total]) => ({ category, total }))
              .sort((a, b) => b.total - a.total)
          : [];

        content.innerHTML = `
          <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:24px;">
            <div class="kpi-card">
              <div class="kpi-label">Total Income</div>
              <div class="kpi-value text-green">${Utils.formatCurrency(data.totalIncome)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Total Expenses</div>
              <div class="kpi-value text-red">${Utils.formatCurrency(data.totalExpenses)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Net Profit</div>
              <div class="kpi-value ${net >= 0 ? 'text-green' : 'text-red'}">
                ${Utils.formatCurrency(net)}
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Transactions</div>
              <div class="kpi-value">${data.transactionCount ?? '—'}</div>
            </div>
          </div>

          ${expCats.length > 0 ? `
            <div class="card" style="margin-bottom:24px;">
              <div class="card-header"><h3 class="card-title">Spending by Category</h3></div>
              <div class="chart-container"><canvas id="categoryChart"></canvas></div>
            </div>
            <div class="card">
              <div class="card-header"><h3 class="card-title">Top Expense Categories</h3></div>
              <div class="table-container">
                <table>
                  <thead><tr><th>Category</th><th>Amount</th></tr></thead>
                  <tbody>
                    ${expCats.slice(0, 8).map(c => `
                      <tr>
                        <td>${c.category}</td>
                        <td class="text-red">${Utils.formatCurrency(c.total)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : `<div class="card"><p class="text-muted" style="padding:16px;">No expense data for this period.</p></div>`}
        `;

        if (expCats.length > 0) {
          ChartHelper.createDoughnutChart('categoryChart', {
            labels: expCats.map(c => c.category),
            datasets: [{
              data: expCats.map(c => c.total),
              backgroundColor: ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'],
            }],
          });
        }
      } else {
        content.innerHTML = '<div class="card"><p class="text-muted" style="padding:16px;">No data available for this period.</p></div>';
      }
    } catch (error) {
      Toast.error('Failed to load report: ' + error.message);
      content.innerHTML = '<div class="card"><p class="text-muted" style="padding:16px;">Failed to load report.</p></div>';
    }
  },
};
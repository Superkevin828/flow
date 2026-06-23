/**
 * Reports page
 */
const ReportsPage = {
  async init() {
    const content = document.getElementById('pageContent');
    if (!content) return;

    const currentMonth = dayjs().format('YYYY-MM');
    const currentYear = dayjs().year();

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
      const month = document.getElementById('monthPicker').value;
      this.loadMonthlyReport(month);
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
              <div class="kpi-value ${data.netProfit >= 0 ? 'text-green' : 'text-red'}">
                ${Utils.formatCurrency(data.netProfit)}
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Transactions</div>
              <div class="kpi-value">${data.transactionCount ?? '—'}</div>
            </div>
          </div>

          ${data.categoryBreakdown ? `
            <div class="card" style="margin-bottom:24px;">
              <div class="card-header"><h3 class="card-title">Spending by Category</h3></div>
              <div class="chart-container"><canvas id="categoryChart"></canvas></div>
            </div>
          ` : ''}

          ${data.topCategories ? `
            <div class="card">
              <div class="card-header"><h3 class="card-title">Top Categories</h3></div>
              <div class="table-container">
                <table>
                  <thead><tr><th>Category</th><th>Amount</th><th>Count</th></tr></thead>
                  <tbody>
                    ${data.topCategories.map(c => `
                      <tr>
                        <td>${c.category}</td>
                        <td>${Utils.formatCurrency(c.total)}</td>
                        <td>${c.count}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}
        `;

        if (data.categoryBreakdown) {
          ChartHelper.createDoughnutChart('categoryChart', {
            labels: data.categoryBreakdown.map(c => c.category),
            datasets: [{
              data: data.categoryBreakdown.map(c => c.total),
              backgroundColor: ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316'],
            }],
          });
        }
      } else {
        content.innerHTML = '<div class="card"><p class="text-muted">No data available for this period.</p></div>';
      }
    } catch (error) {
      Toast.error('Failed to load report: ' + error.message);
      content.innerHTML = '<div class="card"><p class="text-muted">Failed to load report.</p></div>';
    }
  },
};

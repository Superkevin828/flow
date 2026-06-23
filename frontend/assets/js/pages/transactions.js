/**
 * Transactions page
 */
const TransactionsPage = {
  state: {
    page: 1,
    limit: 20,
    total: 0,
    filters: {
      type: '',
      category: '',
      from: '',
      to: '',
      search: '',
    },
  },

  async init() {
    const content = document.getElementById('pageContent');
    if (!content) return;

    content.innerHTML = `
      <div class="page-header">
        <div class="page-actions">
          <div class="search-box">
            <input type="text" id="searchTransactions" placeholder="Search transactions..." class="form-input">
          </div>
          <select id="typeFilter" class="form-select" style="width: 140px;">
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select id="categoryFilter" class="form-select" style="width: 160px;">
            <option value="">All Categories</option>
          </select>
          <input type="date" id="dateFrom" class="form-input" style="width: 150px;" placeholder="From">
          <input type="date" id="dateTo" class="form-input" style="width: 150px;" placeholder="To">
        </div>
        <div class="page-actions-right">
          <button class="btn btn-secondary" id="importCSVBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Import CSV
          </button>
          <button class="btn btn-secondary" id="exportCSVBtn">
            Export CSV
          </button>
          <button class="btn btn-primary" id="addTransactionBtn">
            + Add Transaction
          </button>
        </div>
      </div>

      <div class="table-container" id="transactionsTable">
        <div class="skeleton" style="height: 400px;"></div>
      </div>

      <div class="pagination" id="pagination"></div>
    `;

    // Load transactions
    await this.loadTransactions();
    this.setupEventListeners();
  },

  setupEventListeners() {
    // Search with debounce
    const searchInput = document.getElementById('searchTransactions');
    searchInput?.addEventListener('input', Utils.debounce(() => {
      this.state.filters.search = searchInput.value;
      this.state.page = 1;
      this.loadTransactions();
    }, 300));

    // Filters
    ['typeFilter', 'categoryFilter'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        this.state.filters[id.replace('Filter', '')] = document.getElementById(id).value;
        this.state.page = 1;
        this.loadTransactions();
      });
    });

    ['dateFrom', 'dateTo'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        this.state.filters[id.replace('date', '').toLowerCase()] = document.getElementById(id).value;
        this.state.page = 1;
        this.loadTransactions();
      });
    });

    // Add transaction
    document.getElementById('addTransactionBtn')?.addEventListener('click', () => {
      this.showTransactionModal();
    });

    // Import CSV
    document.getElementById('importCSVBtn')?.addEventListener('click', () => {
      this.showCSVImport();
    });

    // Export CSV
    document.getElementById('exportCSVBtn')?.addEventListener('click', () => {
      this.exportCSV();
    });
  },

  async loadTransactions() {
    try {
      const params = {
        page: this.state.page,
        limit: this.state.limit,
        ...this.state.filters,
      };

      const response = await api.getTransactions(params);
      
      if (response.success) {
        this.state.total = response.data.pagination.total;
        this.renderTransactions(response.data.transactions);
        this.renderPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Load transactions error:', error);
      Toast.error('Failed to load transactions');
    }
  },

  renderTransactions(transactions) {
    const container = document.getElementById('transactionsTable');
    if (!container) return;

    if (transactions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No transactions found</p>
          <button class="btn btn-primary" onclick="TransactionsPage.showTransactionModal()">Add your first transaction</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(t => `
            <tr>
              <td>${Utils.formatDate(t.date)}</td>
              <td>
                <span class="badge ${t.type === 'income' ? 'badge-green' : 'badge-red'}">
                  ${t.type}
                </span>
              </td>
              <td>${t.category}</td>
              <td class="${t.type === 'income' ? 'text-green' : 'text-red'}">
                ${t.type === 'income' ? '+' : '-'}${Utils.formatCurrency(t.amount, t.currency)}
              </td>
              <td>${t.paymentMethod}</td>
              <td>${Utils.truncate(t.note, 30)}</td>
              <td>
                <button class="btn btn-ghost btn-sm edit-transaction" data-id="${t._id}">
                  Edit
                </button>
                <button class="btn btn-ghost btn-sm delete-transaction text-red" data-id="${t._id}">
                  Delete
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Add event listeners to action buttons
    container.querySelectorAll('.edit-transaction').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const transaction = transactions.find(t => t._id === id);
        this.showTransactionModal(transaction);
      });
    });

    container.querySelectorAll('.delete-transaction').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        this.deleteTransaction(id);
      });
    });
  },

  renderPagination(pagination) {
    const container = document.getElementById('pagination');
    if (!container || pagination.pages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    const pages = [];
    for (let i = 1; i <= pagination.pages; i++) {
      if (i === 1 || i === pagination.pages || Math.abs(i - pagination.page) <= 2) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    container.innerHTML = `
      <button class="btn btn-ghost btn-sm" ${pagination.page === 1 ? 'disabled' : ''} 
              onclick="TransactionsPage.goToPage(${pagination.page - 1})">
        Previous
      </button>
      ${pages.map(p => p === '...' 
        ? '<span class="pagination-ellipsis">...</span>'
        : `<button class="btn btn-ghost btn-sm ${p === pagination.page ? 'active' : ''}" 
                  onclick="TransactionsPage.goToPage(${p})">${p}</button>`
      ).join('')}
      <button class="btn btn-ghost btn-sm" ${pagination.page === pagination.pages ? 'disabled' : ''}
              onclick="TransactionsPage.goToPage(${pagination.page + 1})">
        Next
      </button>
    `;
  },

  goToPage(page) {
    this.state.page = page;
    this.loadTransactions();
  },

  showTransactionModal(transaction = null) {
    const isEdit = !!transaction;
    const title = isEdit ? 'Edit Transaction' : 'Add Transaction';

    const categories = [
      'Sales', 'Services', 'Rent', 'Salaries', 'Utilities',
      'Stock', 'Marketing', 'Transport', 'Tax', 'Office Supplies',
      'Insurance', 'Maintenance', 'Other Income', 'Other Expense'
    ];

    const content = `
      <form id="transactionForm">
        <div class="form-group">
          <label>Type</label>
          <select id="txnType" class="form-select" required>
            <option value="income" ${transaction?.type === 'income' ? 'selected' : ''}>Income</option>
            <option value="expense" ${transaction?.type === 'expense' ? 'selected' : ''}>Expense</option>
          </select>
        </div>
        <div class="form-group">
          <label>Amount (${FlowSmart.state.currency})</label>
          <input type="number" id="txnAmount" class="form-input" required 
                 value="${transaction?.amount || ''}" min="0" step="0.01">
        </div>
        <div class="form-group">
          <label>Category</label>
          <select id="txnCategory" class="form-select" required>
            ${categories.map(c => `
              <option value="${c}" ${transaction?.category === c ? 'selected' : ''}>${c}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Payment Method</label>
          <select id="txnMethod" class="form-select">
            <option value="Cash" ${transaction?.paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
            <option value="Mobile Money" ${transaction?.paymentMethod === 'Mobile Money' ? 'selected' : ''}>Mobile Money</option>
            <option value="Bank Transfer" ${transaction?.paymentMethod === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
            <option value="Card" ${transaction?.paymentMethod === 'Card' ? 'selected' : ''}>Card</option>
            <option value="Other" ${transaction?.paymentMethod === 'Other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>Date</label>
          <input type="date" id="txnDate" class="form-input" required 
                 value="${transaction?.date ? dayjs(transaction.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')}">
        </div>
        <div class="form-group">
          <label>Note (optional)</label>
          <textarea id="txnNote" class="form-textarea" maxlength="500">${transaction?.note || ''}</textarea>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary modal-cancel">Cancel</button>
      <button class="btn btn-primary modal-save">${isEdit ? 'Update' : 'Add'} Transaction</button>
    `;

    const modal = Modal.show({ title, content, footer });

    modal.querySelector('.modal-save').addEventListener('click', async () => {
      const data = {
        type: document.getElementById('txnType').value,
        amount: parseFloat(document.getElementById('txnAmount').value),
        category: document.getElementById('txnCategory').value,
        paymentMethod: document.getElementById('txnMethod').value,
        date: document.getElementById('txnDate').value,
        note: document.getElementById('txnNote').value,
        currency: FlowSmart.state.currency,
      };

      try {
        if (isEdit) {
          await api.updateTransaction(transaction._id, data);
          Toast.success('Transaction updated');
        } else {
          await api.createTransaction(data);
          Toast.success('Transaction added');
        }
        Modal.close();
        this.loadTransactions();
      } catch (error) {
        Toast.error(error.message);
      }
    });

    modal.querySelector('.modal-cancel').addEventListener('click', () => Modal.close());
  },

  async deleteTransaction(id) {
    Modal.confirm({
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await api.deleteTransaction(id);
          Toast.success('Transaction deleted');
          this.loadTransactions();
        } catch (error) {
          Toast.error(error.message);
        }
      },
    });
  },

  showCSVImport() {
    const content = `
      <div class="csv-import">
        <div class="csv-dropzone" id="csvDropzone">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <p>Drag & drop CSV file here</p>
          <p class="text-muted">or</p>
          <button class="btn btn-secondary" id="browseCSVBtn">Browse Files</button>
          <input type="file" id="csvFileInput" accept=".csv" class="hidden">
        </div>
        <div id="csvPreview" class="hidden"></div>
      </div>
    `;

    Modal.show({ title: 'Import CSV', content, size: 'large' });

    // Setup drag and drop
    const dropzone = document.getElementById('csvDropzone');
    const fileInput = document.getElementById('csvFileInput');

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--color-primary)';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = '';
    });

    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file) await this.processCSV(file);
    });

    document.getElementById('browseCSVBtn')?.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) await this.processCSV(file);
    });
  },

  async processCSV(file) {
    try {
      const result = await Utils.parseCSV(file);
      
      if (result.data.length === 0) {
        Toast.error('CSV file is empty');
        return;
      }

      const preview = document.getElementById('csvPreview');
      if (preview) {
        preview.classList.remove('hidden');
        preview.innerHTML = `
          <h4>Preview (${result.data.length} rows)</h4>
          <div class="table-container" style="max-height: 300px;">
            <table>
              <thead>
                <tr>
                  ${Object.keys(result.data[0]).map(h => `<th>${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${result.data.slice(0, 10).map(row => `
                  <tr>
                    ${Object.values(row).map(v => `<td>${v}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button class="btn btn-primary" id="confirmImportBtn">Import ${result.data.length} Transactions</button>
          </div>
        `;

        document.getElementById('confirmImportBtn').addEventListener('click', async () => {
          try {
            const importResult = await api.importTransactions(result.data);
            Modal.close();
            Toast.success(`Imported ${importResult.data.imported} transactions`);
            this.loadTransactions();
          } catch (error) {
            Toast.error('Import failed: ' + error.message);
          }
        });
      }
    } catch (error) {
      Toast.error('Failed to parse CSV file');
    }
  },

  async exportCSV() {
    try {
      window.open(`${api.baseURL}/transactions/export`, '_blank');
      Toast.success('CSV export started');
    } catch (error) {
      Toast.error('Export failed');
    }
  },
};
/**
 * Invoices page
 */
const InvoicesPage = {
  async init() {
    const content = document.getElementById('pageContent');
    if (!content) return;

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h2 style="font-size:1.5rem; font-weight:700; margin-bottom:4px;">Invoices</h2>
          <p style="color:var(--color-text-muted)">Create and manage client invoices</p>
        </div>
        <button class="btn btn-primary" id="createInvoiceBtn">+ New Invoice</button>
      </div>

      <div id="invoicesList">
        <div class="skeleton" style="height:400px; border-radius:var(--radius-lg);"></div>
      </div>
    `;

    document.getElementById('createInvoiceBtn')?.addEventListener('click', () => {
      this.showCreateModal();
    });

    await this.loadInvoices();
  },

  async loadInvoices() {
    const container = document.getElementById('invoicesList');
    if (!container) return;

    try {
      const response = await api.getInvoices();

      if (response.success && response.data.invoices.length > 0) {
        container.innerHTML = `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${response.data.invoices.map(inv => `
                  <tr>
                    <td>#${inv.invoiceNumber}</td>
                    <td>${inv.clientName}</td>
                    <td>${Utils.formatCurrency(inv.total)}</td>
                    <td>${Utils.formatDate(inv.dueDate)}</td>
                    <td>
                      <span class="badge ${
                        inv.status === 'paid' ? 'badge-green' :
                        inv.status === 'overdue' ? 'badge-red' : 'badge-amber'
                      }">
                        ${inv.status}
                      </span>
                    </td>
                    <td>
                      ${inv.status !== 'paid' ? `
                        <button class="btn btn-ghost btn-sm" 
                                onclick="InvoicesPage.markPaid('${inv._id}')">Mark Paid</button>
                      ` : ''}
                      <button class="btn btn-ghost btn-sm text-red"
                              onclick="InvoicesPage.deleteInvoice('${inv._id}')">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else if (response.success) {
        container.innerHTML = `
          <div class="empty-state">
            <p>No invoices yet</p>
            <button class="btn btn-primary" onclick="InvoicesPage.showCreateModal()">Create your first invoice</button>
          </div>
        `;
      }
    } catch (error) {
      if (error.status === 403) {
        container.innerHTML = `
          <div class="card" style="text-align:center; padding:60px 20px;">
            <div style="font-size:3rem; margin-bottom:16px;">🔒</div>
            <h3 style="margin-bottom:8px;">Pro Feature</h3>
            <p style="color:var(--color-text-muted); margin-bottom:24px;">Upgrade to Pro to create and manage invoices.</p>
            <button class="btn btn-primary" onclick="Router.navigate('/settings')">Upgrade to Pro</button>
          </div>
        `;
      } else {
        Toast.error('Failed to load invoices');
        container.innerHTML = '<div class="card"><p class="text-muted">Failed to load invoices.</p></div>';
      }
    }
  },

  showCreateModal() {
    const content = `
      <div class="form-group">
        <label>Client Name</label>
        <input type="text" id="invClient" class="form-input" placeholder="Client name">
      </div>
      <div class="form-group">
        <label>Amount (${FlowSmart.state.currency})</label>
        <input type="number" id="invAmount" class="form-input" min="0" step="0.01">
      </div>
      <div class="form-group">
        <label>Due Date</label>
        <input type="date" id="invDueDate" class="form-input" 
               value="${dayjs().add(14, 'day').format('YYYY-MM-DD')}">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="invDescription" class="form-textarea" rows="3" 
                  placeholder="Services rendered..."></textarea>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary modal-cancel">Cancel</button>
      <button class="btn btn-primary modal-save">Create Invoice</button>
    `;

    const modal = Modal.show({ title: 'New Invoice', content, footer });

    modal.querySelector('.modal-cancel').addEventListener('click', () => Modal.close());
    modal.querySelector('.modal-save').addEventListener('click', async () => {
      const data = {
        clientName: document.getElementById('invClient').value.trim(),
        total: parseFloat(document.getElementById('invAmount').value),
        dueDate: document.getElementById('invDueDate').value,
        description: document.getElementById('invDescription').value,
        currency: FlowSmart.state.currency,
      };

      if (!data.clientName || !data.total) {
        Toast.error('Client name and amount are required');
        return;
      }

      try {
        await api.createInvoice(data);
        Toast.success('Invoice created');
        Modal.close();
        this.loadInvoices();
      } catch (error) {
        Toast.error(error.message);
      }
    });
  },

  async markPaid(id) {
    try {
      await api.markInvoicePaid(id);
      Toast.success('Invoice marked as paid');
      this.loadInvoices();
    } catch (error) {
      Toast.error(error.message);
    }
  },

  async deleteInvoice(id) {
    Modal.confirm({
      title: 'Delete Invoice',
      message: 'Are you sure you want to delete this invoice?',
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await api.deleteInvoice(id);
          Toast.success('Invoice deleted');
          this.loadInvoices();
        } catch (error) {
          Toast.error(error.message);
        }
      },
    });
  },
};

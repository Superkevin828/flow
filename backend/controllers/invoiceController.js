const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const nodemailer = require('nodemailer');

class InvoiceController {
  /**
   * Get all invoices
   */
  static async getInvoices(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const query = { userId: req.user._id };

      if (status && ['draft', 'sent', 'paid', 'overdue'].includes(status)) {
        query.status = status;
      }

      // Auto-update overdue invoices
      const now = new Date();
      await Invoice.updateMany(
        {
          userId: req.user._id,
          status: { $in: ['draft', 'sent'] },
          dueDate: { $lt: now }
        },
        { status: 'overdue' }
      );

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [invoices, total] = await Promise.all([
        Invoice.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Invoice.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          invoices,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invoices'
      });
    }
  }

  /**
   * Create invoice
   */
  static async createInvoice(req, res) {
    try {
      const { clientName, clientEmail, items, vatRate = 0, dueDate, notes } = req.body;

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const vatAmount = subtotal * (vatRate / 100);
      const totalAmount = subtotal + vatAmount;

      // Generate invoice number
      const invoiceCount = await Invoice.countDocuments({ userId: req.user._id });
      const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, '0')}`;

      const invoice = new Invoice({
        userId: req.user._id,
        invoiceNumber,
        clientName,
        clientEmail,
        items,
        subtotal,
        vatRate,
        vatAmount,
        totalAmount,
        currency: req.user.currency,
        dueDate: new Date(dueDate),
        notes: notes || '',
        status: 'draft'
      });

      await invoice.save();

      res.status(201).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      console.error('Create invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create invoice'
      });
    }
  }

  /**
   * Update invoice
   */
  static async updateInvoice(req, res) {
    try {
      const invoice = await Invoice.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      if (invoice.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Cannot edit a paid invoice'
        });
      }

      const { clientName, clientEmail, items, vatRate, dueDate, notes } = req.body;

      if (clientName) invoice.clientName = clientName;
      if (clientEmail) invoice.clientEmail = clientEmail;
      if (notes !== undefined) invoice.notes = notes;
      if (dueDate) invoice.dueDate = new Date(dueDate);

      if (items) {
        invoice.items = items;
        invoice.subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        invoice.vatRate = vatRate || invoice.vatRate;
        invoice.vatAmount = invoice.subtotal * (invoice.vatRate / 100);
        invoice.totalAmount = invoice.subtotal + invoice.vatAmount;
      }

      await invoice.save();

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      console.error('Update invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update invoice'
      });
    }
  }

  /**
   * Delete invoice
   */
  static async deleteInvoice(req, res) {
    try {
      const invoice = await Invoice.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id,
        status: { $ne: 'paid' }
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found or cannot be deleted'
        });
      }

      res.json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      console.error('Delete invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete invoice'
      });
    }
  }

  /**
   * Mark invoice as paid
   */
  static async markAsPaid(req, res) {
    try {
      const invoice = await Invoice.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      if (invoice.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Invoice is already marked as paid'
        });
      }

      invoice.status = 'paid';
      invoice.paidAt = new Date();
      await invoice.save();

      // Auto-create income transaction
      const transaction = new Transaction({
        userId: req.user._id,
        type: 'income',
        amount: invoice.totalAmount,
        currency: invoice.currency,
        category: 'Sales',
        paymentMethod: 'Bank Transfer',
        date: new Date(),
        note: `Payment for invoice ${invoice.invoiceNumber} - ${invoice.clientName}`
      });
      await transaction.save();

      res.json({
        success: true,
        data: {
          invoice,
          transaction
        }
      });
    } catch (error) {
      console.error('Mark as paid error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark invoice as paid'
      });
    }
  }

  /**
   * Send invoice via email
   */
  static async sendInvoice(req, res) {
    try {
      const invoice = await Invoice.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Configure Nodemailer
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invoice from ${req.user.businessName || req.user.name}</h2>
          <p>Dear ${invoice.clientName},</p>
          <p>Please find your invoice attached.</p>
          <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Amount Due:</strong> ${invoice.currency} ${invoice.totalAmount.toLocaleString()}</p>
          <p><strong>Due Date:</strong> ${invoice.dueDate.toLocaleDateString()}</p>
          ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
          <p>Thank you for your business!</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"${req.user.businessName || req.user.name}" <${process.env.EMAIL_USER}>`,
        to: invoice.clientEmail,
        subject: `Invoice ${invoice.invoiceNumber} from ${req.user.businessName || req.user.name}`,
        html: emailHtml
      });

      // Update status to sent
      if (invoice.status === 'draft') {
        invoice.status = 'sent';
        await invoice.save();
      }

      res.json({
        success: true,
        message: 'Invoice sent successfully'
      });
    } catch (error) {
      console.error('Send invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send invoice'
      });
    }
  }
}

module.exports = InvoiceController;
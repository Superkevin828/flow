const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  clientEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  items: [{
    description: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  vatRate: {
    type: Number,
    default: 0 // 0, 18 for VAT
  },
  vatAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['UGX', 'USD'],
    default: 'UGX'
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue'],
    default: 'draft'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  }
}, {
  timestamps: true
});

invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
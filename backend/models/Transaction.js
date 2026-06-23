const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['UGX', 'USD'],
    default: 'UGX'
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: [
      'Sales', 'Services', 'Rent', 'Salaries', 'Utilities',
      'Stock', 'Marketing', 'Transport', 'Tax', 'Office Supplies',
      'Insurance', 'Maintenance', 'Other Income', 'Other Expense'
    ]
  },
  paymentMethod: {
    type: String,
    enum: ['Mobile Money', 'Bank Transfer', 'Cash', 'Card', 'Other'],
    default: 'Cash'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  note: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true
});

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
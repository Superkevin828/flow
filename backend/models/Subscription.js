const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  pesapalOrderId: {
    type: String,
    unique: true,
    sparse: true
  },
  plan: {
    type: String,
    enum: ['pro'],
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'UGX'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'cancelled', 'failed'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  pesapalResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
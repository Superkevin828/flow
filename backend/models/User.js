const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  businessName: {
    type: String,
    trim: true,
    default: ''
  },
  industry: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  plan: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free'
  },
  planExpiresAt: {
    type: Date,
    default: null
  },
  currency: {
    type: String,
    enum: ['UGX', 'USD'],
    default: 'UGX'
  },
  refreshTokenHash: {
    type: String,
    default: null
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  notifications: {
    lowCashRunway: {
      type: Boolean,
      default: true
    },
    weeklyReport: {
      type: Boolean,
      default: false
    }
  },
  businessProfileCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });
userSchema.index({ plan: 1 });

module.exports = mongoose.model('User', userSchema);
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const pesapalService = require('../services/pesapalService');

class SubscriptionController {
  /**
   * Get subscription status
   */
  static async getStatus(req, res) {
    try {
      const subscription = await Subscription.findOne({
        userId: req.user._id,
        status: 'active'
      }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: {
          plan: req.user.plan,
          planExpiresAt: req.user.planExpiresAt,
          isActive: req.user.plan === 'pro' && req.user.planExpiresAt > new Date(),
          subscription: subscription || null
        }
      });
    } catch (error) {
      console.error('Subscription status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription status'
      });
    }
  }

  /**
   * Initiate payment for Pro plan
   */
  static async initiatePayment(req, res) {
    try {
      const { billingCycle = 'monthly' } = req.body;
      
      const amounts = {
        monthly: 35000,
        yearly: 350000
      };

      const amount = amounts[billingCycle];
      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Invalid billing cycle'
        });
      }

      // Create subscription record
      const subscription = new Subscription({
        userId: req.user._id,
        plan: 'pro',
        billingCycle,
        amount,
        currency: 'UGX',
        status: 'pending'
      });

      await subscription.save();

      // Generate order ID
      const orderId = `FS-${req.user._id}-${Date.now()}`;
      subscription.pesapalOrderId = orderId;
      await subscription.save();

      // Initiate Pesapal payment
      const ipnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/subscriptions/webhook`;
      const callbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?payment=complete`;

      const pesapalResponse = await pesapalService.submitOrder({
        orderId,
        amount,
        currency: 'UGX',
        description: `FlowSmart Pro ${billingCycle} subscription`,
        callbackUrl,
        ipnId: ipnUrl,
        email: req.user.email,
        firstName: req.user.name.split(' ')[0],
        lastName: req.user.name.split(' ').slice(1).join(' '),
        phone: ''
      });

      subscription.pesapalResponse = pesapalResponse;
      await subscription.save();

      res.json({
        success: true,
        data: {
          redirectUrl: pesapalResponse.redirectUrl,
          orderTrackingId: pesapalResponse.orderTrackingId,
          subscriptionId: subscription._id
        }
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate payment'
      });
    }
  }

  /**
   * Handle Pesapal IPN webhook
   */
  static async handleWebhook(req, res) {
    try {
      console.log('IPN Webhook received:', req.body);
      
      const { order_tracking_id, order_notification_type, order_merchant_reference } = req.body;

      if (order_notification_type === 'IPNCHANGE') {
        // Get transaction status from Pesapal
        const status = await pesapalService.getTransactionStatus(order_tracking_id);

        if (status.payment_status_description === 'Completed') {
          const subscription = await Subscription.findOne({
            pesapalOrderId: order_merchant_reference
          });

          if (subscription && subscription.status === 'pending') {
            // Update subscription
            subscription.status = 'active';
            subscription.startDate = new Date();
            
            const duration = subscription.billingCycle === 'yearly' ? 365 : 30;
            subscription.endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
            
            await subscription.save();

            // Update user plan
            const user = await User.findById(subscription.userId);
            if (user) {
              user.plan = 'pro';
              user.planExpiresAt = subscription.endDate;
              await user.save();
            }

            console.log(`Subscription activated for user ${subscription.userId}`);
          }
        } else if (status.payment_status_description === 'Failed') {
          const subscription = await Subscription.findOne({
            pesapalOrderId: order_merchant_reference
          });
          if (subscription) {
            subscription.status = 'failed';
            await subscription.save();
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook handling error:', error);
      res.status(500).json({ success: false });
    }
  }
}

module.exports = SubscriptionController;
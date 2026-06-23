const axios = require('axios');

class PesapalService {
  constructor() {
    this.baseURL = process.env.PESAPAL_ENV === 'production'
      ? 'https://pay.pesapal.com/v3'
      : 'https://cybqa.pesapal.com/pesapalv3';
    this.consumerKey = process.env.PESAPAL_CONSUMER_KEY;
    this.consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
    this.tokenCache = null;
    this.tokenExpiry = null;
  }

  /**
   * Get OAuth token for API authentication
   */
  async getToken() {
    if (this.tokenCache && this.tokenExpiry > Date.now()) {
      return this.tokenCache;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/api/Auth/RequestToken`,
        {
          consumer_key: this.consumerKey,
          consumer_secret: this.consumerSecret
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      this.tokenCache = response.data.token;
      // Tokens typically expire in 1 hour
      this.tokenExpiry = Date.now() + 55 * 60 * 1000;
      return this.tokenCache;
    } catch (error) {
      console.error('Pesapal auth error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Pesapal');
    }
  }

  /**
   * Register IPN URL for payment notifications
   */
  async registerIPN(ipnUrl) {
    const token = await this.getToken();
    
    try {
      const response = await axios.post(
        `${this.baseURL}/api/URLSetup/RegisterIPN`,
        {
          url: ipnUrl,
          ipn_notification_type: 'POST'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('IPN registration error:', error.response?.data || error.message);
      throw new Error('Failed to register IPN URL');
    }
  }

  /**
   * Initiate payment order
   */
  async submitOrder(orderData) {
    const token = await this.getToken();
    
    try {
      const response = await axios.post(
        `${this.baseURL}/api/Transactions/SubmitOrderRequest`,
        {
          id: orderData.orderId,
          currency: orderData.currency || 'UGX',
          amount: orderData.amount,
          description: orderData.description,
          callback_url: orderData.callbackUrl,
          notification_id: orderData.ipnId,
          billing_address: {
            email_address: orderData.email,
            phone_number: orderData.phone || '',
            country_code: 'UG',
            first_name: orderData.firstName || '',
            last_name: orderData.lastName || ''
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        orderTrackingId: response.data.order_tracking_id,
        redirectUrl: response.data.redirect_url,
        ...response.data
      };
    } catch (error) {
      console.error('Order submission error:', error.response?.data || error.message);
      throw new Error('Failed to initiate payment');
    }
  }

  /**
   * Check transaction status
   */
  async getTransactionStatus(orderTrackingId) {
    const token = await this.getToken();
    
    try {
      const response = await axios.get(
        `${this.baseURL}/api/Transactions/GetTransactionStatus`,
        {
          params: { orderTrackingId },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Status check error:', error.response?.data || error.message);
      throw new Error('Failed to check transaction status');
    }
  }
}

module.exports = new PesapalService();
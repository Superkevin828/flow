const express = require('express');
const SubscriptionController = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/status', auth, SubscriptionController.getStatus);
router.post('/initiate', auth, SubscriptionController.initiatePayment);
router.post('/webhook', SubscriptionController.handleWebhook);

module.exports = router;
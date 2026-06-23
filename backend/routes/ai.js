const express = require('express');
const AIController = require('../controllers/aiController');
const auth = require('../middleware/auth');
const checkPlan = require('../middleware/plan');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

router.use(auth);
router.use(rateLimiter.ai);

router.post('/forecast', checkPlan('pro'), AIController.generateForecast);
router.post('/insights', checkPlan('pro'), AIController.generateInsights);

module.exports = router;
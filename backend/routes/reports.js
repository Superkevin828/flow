const express = require('express');
const ReportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const checkPlan = require('../middleware/plan');

const router = express.Router();

router.use(auth);

router.get('/summary', ReportController.getSummary);
router.get('/monthly', ReportController.getMonthlyReport);
router.get('/annual', checkPlan('pro'), ReportController.getAnnualReport);

module.exports = router;
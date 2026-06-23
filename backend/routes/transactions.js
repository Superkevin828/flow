const express = require('express');
const { body, query } = require('express-validator');
const TransactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(auth);

router.get('/', TransactionController.getTransactions);

router.post('/',
  validate([
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').isISO8601().withMessage('Valid date is required')
  ]),
  TransactionController.createTransaction
);

router.put('/:id', TransactionController.updateTransaction);
router.delete('/:id', TransactionController.deleteTransaction);
router.post('/import', TransactionController.importCSV);
router.get('/export', TransactionController.exportCSV);

module.exports = router;
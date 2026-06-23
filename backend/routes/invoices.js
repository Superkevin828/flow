const express = require('express');
const InvoiceController = require('../controllers/invoiceController');
const auth = require('../middleware/auth');
const checkPlan = require('../middleware/plan');

const router = express.Router();

router.use(auth);
router.use(checkPlan('pro'));

router.get('/', InvoiceController.getInvoices);
router.post('/', InvoiceController.createInvoice);
router.put('/:id', InvoiceController.updateInvoice);
router.delete('/:id', InvoiceController.deleteInvoice);
router.post('/:id/mark-paid', InvoiceController.markAsPaid);
router.post('/:id/send', InvoiceController.sendInvoice);

module.exports = router;
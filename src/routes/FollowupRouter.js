const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
// const InvoiceController = require('../controllers').InvoiceController;

// router.get(
//   '/getTicketPerformaDetails/:ticket_id',
//   authMiddleware,
//   InvoiceController.getTicketPerforma
// );

// router.get(
//   '/getTicketInvoiceDetails/:ticket_id',
//   authMiddleware,
//   InvoiceController.getTicketInvoice
// );

// router.post(
//   '/performaAddSubticket',
//   authMiddleware,
//   InvoiceController.addSubTicket
// );

// router.post(
//   '/deleteSubTicket/:ticket_id',
//   authMiddleware,
//   InvoiceController.deleteSubTicket
// );

// router.post(
//   '/undoDeletedSubticket/:ticket_id',
//   authMiddleware,
//   InvoiceController.undoSubticket
// );

// router.post('/createInvoice', authMiddleware, InvoiceController.createInvoice);

// router.post('/savePerforma', authMiddleware, InvoiceController.savePerforma);
module.exports = router;

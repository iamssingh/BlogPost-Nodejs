const express = require('express');
const router = express.Router();
// const ticketController = require('../controllers').TicketController;
// const {
//   ticketEstimateValidation,
//   estimateSendValidation,
// } = require('../validators/ticketValidator');
// const { authMiddleware } = require('../middleware/auth');
// const { idValidation } = require('../validators/validator');

// router.post('/ticket/list', [authMiddleware], ticketController.list);
// router.get(
//   '/ticket/details/:ticket_id',
//   [authMiddleware],
//   ticketController.detail
// );
// router.post('/ticket/add', [authMiddleware], ticketController.add);
// router.patch(
//   '/ticket/update',
//   [authMiddleware, idValidation],
//   ticketController.update
// );
// router.patch(
//   '/ticket-details/update',
//   [authMiddleware],
//   ticketController.updateticketdetails
// );
// router.patch(
//   '/check-in/cancel',
//   [authMiddleware],
//   ticketController.cancelAssetCheckIn
// );
// router.patch(
//   '/ticket/estimation-update',
//   [authMiddleware, ticketEstimateValidation],
//   ticketController.updateEstimate
// );
// router.patch(
//   '/ticket/estimation-send',
//   [authMiddleware, estimateSendValidation],
//   ticketController.estimationSent
// );
// router.patch(
//   '/ticket/update-status',
//   [authMiddleware, idValidation],
//   ticketController.statusUpdate
// );
// // edit washout certificateNumber
// router.patch(
//   '/ticket/update/certificate/:id?',
//   [authMiddleware],
//   ticketController.editWashOutCertificateNo
// )
// // edit services from washoutcertificate....
// router.patch(
//   '/ticket/update/certificate/services/:id?',
//   [authMiddleware],
//   ticketController.editWashOutCertificateServices
// )
module.exports = router;

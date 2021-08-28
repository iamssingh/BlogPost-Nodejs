const express = require('express');
const router = express.Router();
const TagController = require('../controllers').TagController;
// const { authMiddleware } = require('../middleware/auth');
// const { idValidation } = require('../validators/validator');
// const {
//   addServiceValidation,
//   updateServiceValidation,
//   deleteServiceValidation
// } = require('../validators/serviceValidator');

// router.get('/service/list', [authMiddleware], TagController.list);
// router.get(
//   '/get/certificate/services',
//   [authMiddleware],
//   TagController.getWashoutCertificateClientMstServices
// );
// router.get(
//   '/service/list-for-selectbox/:status?',
//   [authMiddleware],
//   TagController.allservicesList
// );

// router.get(
//   '/service/details/:client_id',
//   [authMiddleware],
//   TagController.details
// );

// router.post(
//   '/service/add',
//   [authMiddleware, addServiceValidation],
//   TagController.serviceAdd
// );

// router.patch(
//   '/service/changeStatus',
//   authMiddleware,
//   TagController.changeServiceStatus
// );

// router.patch(
//   '/service/update',
//   [authMiddleware, updateServiceValidation],
//   TagController.update
// );

// router.delete(
//   '/service/delete/:id',
//   [authMiddleware],
//   TagController.delete
// );
module.exports = router;

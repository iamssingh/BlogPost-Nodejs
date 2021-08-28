const express = require('express');
const router = express.Router();
// const { authMiddleware } = require('../middleware/auth');
// const {
//     approveAssetTxnsValidation,
//     assetCheckoutValidation,
// } = require('../validators/assetTxnValidator');
// const { assetEditValidator } = require('../validators/assetValidator');
// const assetController = require('../controllers').AssetController;
// const assetTxnController = require('../controllers').AssetTxnController;

// router
//     .get('/asset/search/:custId', [authMiddleware], assetController.searchAsset)
//     .get(
//         '/checkedin-equipment-list', [authMiddleware],
//         assetController.getCheckedInEquipmentList
//     )
//     .post('/asset/save', authMiddleware, assetController.saveAsset)
//     .post('/assetTxn/save', authMiddleware, assetTxnController.saveAssetTxns)
//     .post(
//         '/asset-checkin/approve', [authMiddleware, approveAssetTxnsValidation],
//         assetTxnController.approveAsset
//     )
//     .post(
//         '/asset-checkin-list',
//         authMiddleware,
//         assetTxnController.assetCheckinList
//     )
//     .post('/equipment/checkin', authMiddleware, assetController.EquipmentCheckIn)
//     .post(
//         '/equipment/checkout', [authMiddleware, assetCheckoutValidation],
//         assetController.EquipmentCheckOut
//     )
//     .patch(
//         '/equipment/checkin/edit', [assetEditValidator, authMiddleware],
//         assetController.EditEquipmentCheckIn
//     )
//     .get(
//         '/equipment/checkInData/:assetTxnId', [authMiddleware],
//         assetController.getCheckInAssetData
//     )
//     .patch(
//         '/reject/checkedInEquipment',
//         authMiddleware,
//         assetController.RejectEquipmentCheckIn
//     );
module.exports = router;
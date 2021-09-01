const express = require('express');
const router = express.Router();
const TagController = require('../controllers').TagController;
const { authMiddleware } = require('../middleware/auth');
const {
  tagAddValidator,
  tagUpdateValidator
} = require('../validators/TagValidator');

router.get('/tags', [authMiddleware], TagController.list);

router.post(
  '/tag/add',
  [authMiddleware,tagAddValidator],
  TagController.add
);
router.get(
  '/tag/:id',
  [authMiddleware],
  TagController.detail
);

router.patch(
  '/tag/update',
  [authMiddleware,tagUpdateValidator],
  TagController.update
);
module.exports = router;

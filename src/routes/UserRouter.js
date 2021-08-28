const express = require('express');
const router = express.Router();
const UserController = require('../controllers').UserController;
const { authMiddleware } = require('../middleware/auth');
const { upload, deleteimage } = require('../s3Bucket/s3Upload');
const {
  loginValidation,
  registerValidation,
} = require('../validators/UserValidator');

router.get('/', async (req, res) => {
  return res.status(200).send({
    welcome: 'Welcome to the backend',
  });
});
router
  .post('/user/login', loginValidation, UserController.userLogin)
  .post(
    '/user/signup',
    UserController.userSignUp
  )
  .get('/user/:id', authMiddleware, UserController.detail)
  .patch('/user/update', authMiddleware, UserController.update)
  .post(
    '/image/upload',
    [authMiddleware, upload.single('file')],
    UserController.imageUpload
  )
  .patch(
    '/user/account/ChangeStatus',
    authMiddleware,
    UserController.changeStatus
  )
  .patch(
    '/user/changePassword',
    authMiddleware,
    UserController.changePassword
  )

module.exports = router;

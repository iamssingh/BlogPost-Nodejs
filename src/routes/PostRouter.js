const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
    addPostValidation,
    updatePostValidation,
} = require('../validators/PostValidator');
const PostController = require('../controllers').PostController;

router
.get('/post', [authMiddleware], PostController.list)
.get('/post/:slug', [authMiddleware], PostController.detail)
.post('/post/add', [authMiddleware,addPostValidation], PostController.add)
.patch('/post/update', [authMiddleware,updatePostValidation], PostController.update);

module.exports = router;
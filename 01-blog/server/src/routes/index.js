import { Router } from 'express';
import { register, login, me, updateProfile, publicProfile } from '../controllers/authController.js';
import {
  listPosts, getPost, createPost, updatePost, deletePost, toggleLike, archive,
} from '../controllers/postController.js';
import { listComments, createComment, deleteComment } from '../controllers/commentController.js';
import { listCategories } from '../controllers/categoryController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// 认证
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, me);
router.put('/auth/profile', requireAuth, updateProfile);
router.get('/users/:id', publicProfile);

// 分类
router.get('/categories', listCategories);

// 文章
router.get('/posts/archive', archive);           // 归档（放在 /:id 之前，避免被当作 id）
router.get('/posts', optionalAuth, listPosts);
router.get('/posts/:id', optionalAuth, getPost);
router.post('/posts', requireAuth, createPost);
router.put('/posts/:id', requireAuth, updatePost);
router.delete('/posts/:id', requireAuth, deletePost);
router.post('/posts/:id/like', requireAuth, toggleLike);

// 评论
router.get('/comments', listComments);
router.post('/comments', requireAuth, createComment);
router.delete('/comments/:id', requireAuth, deleteComment);

export default router;

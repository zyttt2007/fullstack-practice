import { Router } from 'express';
import { register, login, me, updateProfile } from '../controllers/authController.js';
import {
  listQuestions, getQuestion, askQuestion, answerQuestion, acceptAnswer,
  toggleVote, hotTags, leaderboard, mine,
} from '../controllers/questionController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, me);
router.put('/auth/profile', requireAuth, updateProfile);

router.get('/questions', optionalAuth, listQuestions);
router.get('/questions/:id', optionalAuth, getQuestion);
router.post('/questions', requireAuth, askQuestion);
router.post('/questions/:id/answers', requireAuth, answerQuestion);

router.post('/answers/:id/accept', requireAuth, acceptAnswer);
router.post('/votes/toggle', requireAuth, toggleVote);

router.get('/tags', hotTags);
router.get('/leaderboard', leaderboard);
router.get('/mine', requireAuth, mine);

export default router;

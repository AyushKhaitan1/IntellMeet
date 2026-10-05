import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema
} from '../validations/auth.validation.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/signup', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh-token', authLimiter, validate(refreshTokenSchema), refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;

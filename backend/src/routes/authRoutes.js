/**
 * Authentication Routes
 */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { protect } from '../middleware/auth.js';
import { authSchemas } from '../validators/index.js';
import * as authController from '../controllers/authController.js';

const router = Router();

router.post('/register', authRateLimiter, validate(authSchemas.register), authController.register);
router.post('/login', authRateLimiter, validate(authSchemas.login), authController.login);
router.get('/me', protect, authController.getMe);

export default router;

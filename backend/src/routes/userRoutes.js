/**
 * User Profile Routes
 */
import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = Router();

router.use(protect);
router.patch('/profile', userController.updateProfile);
router.get('/macros', userController.getMacros);
router.put('/macros', userController.saveMacros);

export default router;

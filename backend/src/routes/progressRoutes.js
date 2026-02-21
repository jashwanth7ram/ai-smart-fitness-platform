/**
 * Progress & Reports Routes
 */
import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as progressController from '../controllers/progressController.js';

const router = Router();

router.use(protect);
router.get('/weight-trend', progressController.getWeightTrend);
router.get('/weekly', progressController.getWeeklyProgress);

export default router;

/**
 * AI Recommendations Routes
 */
import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as aiController from '../controllers/aiController.js';

const router = Router();

router.use(protect);

router.get('/calorie-macro', aiController.getCalorieMacro);
router.get('/diet-plan', aiController.getDietPlan);
router.get('/food-suggestions', aiController.getFoodSuggestions);
router.get('/motivation', aiController.getMotivation);
router.get('/plateau-check', aiController.getPlateauCheck);
router.get('/history', aiController.getRecommendationHistory);

export default router;

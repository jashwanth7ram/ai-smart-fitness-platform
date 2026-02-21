/**
 * Health Log Routes (RESTful)
 */
import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { healthLogSchemas } from '../validators/index.js';
import * as healthLogController from '../controllers/healthLogController.js';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(validate(healthLogSchemas.query), healthLogController.getLogs)
  .post(validate(healthLogSchemas.create), healthLogController.createLog);

router
  .route('/:id')
  .get(healthLogController.getLogById)
  .patch(healthLogController.updateLog)
  .delete(healthLogController.deleteLog);

export default router;

/**
 * API Route Aggregation
 */
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import healthLogRoutes from './healthLogRoutes.js';
import progressRoutes from './progressRoutes.js';
import aiRoutes from './aiRoutes.js';
import userRoutes from './userRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/logs', healthLogRoutes);
router.use('/progress', progressRoutes);
router.use('/ai', aiRoutes);

export default router;

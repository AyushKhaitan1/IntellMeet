import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import meetingRoutes from './meeting.routes.js';
import workspaceRoutes from './workspace.routes.js';
import taskRoutes from './task.routes.js';
import intelligenceRoutes from './intelligence.routes.js';
import analyticsRoutes from './analytics.routes.js';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/meetings', meetingRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/tasks', taskRoutes);
router.use('/intelligence', intelligenceRoutes);
router.use('/analytics', analyticsRoutes);

export default router;

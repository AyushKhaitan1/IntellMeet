import { Router } from 'express';
import {
  getUserAnalytics,
  getWorkspaceAnalytics
} from '../controllers/analytics.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/user', getUserAnalytics);
router.get('/workspaces/:workspaceId', getWorkspaceAnalytics);

export default router;

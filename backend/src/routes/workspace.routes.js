import { Router } from 'express';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  inviteMember,
  removeMember
} from '../controllers/workspace.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createWorkspaceSchema,
  inviteMemberSchema
} from '../validations/workspace.validation.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createWorkspaceSchema), createWorkspace);
router.get('/', getUserWorkspaces);
router.get('/:id', getWorkspaceById);
router.post('/:id/invite', validate(inviteMemberSchema), inviteMember);
router.delete('/:id/members/:userId', removeMember);

export default router;

import { Router } from 'express';
import {
  createTask,
  getTasksByWorkspace,
  updateTask,
  moveTaskStatus,
  deleteTask
} from '../controllers/task.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskStatusSchema
} from '../validations/task.validation.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createTaskSchema), createTask);
router.get('/workspace/:workspaceId', getTasksByWorkspace);
router.put('/:id', validate(updateTaskSchema), updateTask);
router.patch('/:id/move', validate(moveTaskStatusSchema), moveTaskStatus);
router.delete('/:id', deleteTask);

export default router;

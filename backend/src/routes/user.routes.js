import { Router } from 'express';
import { updateProfile, uploadAvatar } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateProfileSchema } from '../validations/auth.validation.js';

const router = Router();

router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);

export default router;

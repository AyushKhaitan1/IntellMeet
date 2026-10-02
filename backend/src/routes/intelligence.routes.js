import { Router } from 'express';
import {
  saveTranscript,
  getTranscript,
  saveSummaryAndActionItems,
  getMeetingIntelligence,
  convertActionItemToTask,
  exportMeetingNotes
} from '../controllers/intelligence.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  saveTranscriptSchema,
  saveSummarySchema
} from '../validations/intelligence.validation.js';

const router = Router();

// Transcript endpoints
router.post(
  '/meetings/:meetingId/transcript',
  authenticate,
  validate(saveTranscriptSchema),
  saveTranscript
);
router.get('/meetings/:meetingId/transcript', authenticate, getTranscript);

// Summary & Action Items endpoints
router.post(
  '/meetings/:meetingId/summary',
  authenticate,
  validate(saveSummarySchema),
  saveSummaryAndActionItems
);
router.get('/meetings/:meetingId/report', authenticate, getMeetingIntelligence);

// Convert action item to board task
router.post(
  '/meetings/:meetingId/actions/:actionItemId/to-task',
  authenticate,
  convertActionItemToTask
);

// Export meeting markdown
router.get('/meetings/:meetingId/export', exportMeetingNotes);

export default router;

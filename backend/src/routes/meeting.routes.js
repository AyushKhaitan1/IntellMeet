import { Router } from 'express';
import {
  createMeeting,
  getMyMeetings,
  getMeetingByCode,
  joinMeeting,
  updateMeeting,
  endMeeting,
  getMeetingHistory,
  getMeetingSummaryByRoomId
} from '../controllers/meeting.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createMeetingSchema,
  updateMeetingSchema,
  joinMeetingSchema
} from '../validations/meeting.validation.js';

const router = Router();

router.post('/', authenticate, validate(createMeetingSchema), createMeeting);
router.get('/', authenticate, getMyMeetings);
router.get('/history', authenticate, getMeetingHistory);
router.get('/code/:code', getMeetingByCode);
router.post('/code/:code/join', validate(joinMeetingSchema), joinMeeting);
router.get('/:roomId/summary', getMeetingSummaryByRoomId);
router.put('/:id', authenticate, validate(updateMeetingSchema), updateMeeting);
router.post('/:id/end', authenticate, endMeeting);

export default router;

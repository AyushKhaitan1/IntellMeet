import { z } from 'zod';

export const createMeetingSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(120),
  description: z.string().max(500).optional(),
  passcode: z.string().max(20).optional(),
  workspace: z.string().optional(),
  scheduledStartTime: z.string().or(z.date()).optional(),
  scheduledEndTime: z.string().or(z.date()).optional(),
  settings: z
    .object({
      allowScreenShare: z.boolean().optional(),
      muteOnEntry: z.boolean().optional(),
      chatEnabled: z.boolean().optional(),
      waitingRoom: z.boolean().optional(),
      aiRecordingEnabled: z.boolean().optional()
    })
    .optional()
});

export const updateMeetingSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['scheduled', 'live', 'ended', 'cancelled']).optional(),
  passcode: z.string().max(20).optional(),
  settings: z
    .object({
      allowScreenShare: z.boolean().optional(),
      muteOnEntry: z.boolean().optional(),
      chatEnabled: z.boolean().optional(),
      waitingRoom: z.boolean().optional(),
      aiRecordingEnabled: z.boolean().optional()
    })
    .optional(),
  recordingUrl: z.string().url().optional().or(z.literal(''))
});

export const joinMeetingSchema = z.object({
  passcode: z.string().optional(),
  displayName: z.string().optional()
});

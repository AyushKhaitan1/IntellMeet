import { z } from 'zod';

export const saveTranscriptSchema = z.object({
  transcript: z.array(
    z.object({
      speaker: z.string(),
      speakerId: z.string().optional(),
      timestamp: z.string().optional(),
      text: z.string().min(1, 'Transcript line cannot be empty')
    })
  )
});

export const saveSummarySchema = z.object({
  summary: z.object({
    overview: z.string().optional(),
    keyPoints: z.array(z.string()).optional(),
    decisions: z.array(z.string()).optional(),
    highlights: z.array(z.string()).optional()
  }),
  extractedActionItems: z
    .array(
      z.object({
        taskTitle: z.string(),
        assigneeName: z.string().optional(),
        dueDate: z.string().or(z.date()).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
      })
    )
    .optional(),
  sentiment: z
    .object({
      score: z.number().optional(),
      label: z.enum(['positive', 'neutral', 'negative']).optional(),
      positivePercent: z.number().optional(),
      neutralPercent: z.number().optional(),
      negativePercent: z.number().optional()
    })
    .optional(),
  aiModelUsed: z.string().optional(),
  audioRecordingUrl: z.string().optional()
});

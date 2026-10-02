import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  description: z.string().max(300).optional(),
  avatar: z.string().optional()
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Please provide a valid email'),
  role: z.enum(['admin', 'member', 'viewer']).default('member')
});

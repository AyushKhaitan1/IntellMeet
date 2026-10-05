import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title must be at least 2 characters').max(150),
  description: z.string().max(1000).optional(),
  workspace: z.string().optional(),
  meeting: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'in-progress', 'in_review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignee: z.string().optional(),
  dueDate: z.string().or(z.date()).optional(),
  tags: z.array(z.string()).optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).max(150).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['todo', 'in_progress', 'in-progress', 'in_review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignee: z.string().nullable().optional(),
  dueDate: z.string().or(z.date()).nullable().optional(),
  tags: z.array(z.string()).optional(),
  order: z.number().optional()
});

export const moveTaskStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'in-progress', 'in_review', 'done']),
  order: z.number().optional()
});

import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  title: z.string().optional(),
  department: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Valid refresh token is required')
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(250).optional(),
  title: z.string().max(80).optional(),
  department: z.string().max(80).optional(),
  preferences: z
    .object({
      audioMutedDefault: z.boolean().optional(),
      videoMutedDefault: z.boolean().optional(),
      theme: z.enum(['dark', 'light', 'system']).optional(),
      emailNotifications: z.boolean().optional()
    })
    .optional()
});

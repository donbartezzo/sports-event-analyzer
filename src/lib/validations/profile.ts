import * as z from 'zod';

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(500, 'Bio must not exceed 500 characters').optional(),
  preferredAnalysisType: z.enum(['basic', 'advanced', 'expert']).optional(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
  }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

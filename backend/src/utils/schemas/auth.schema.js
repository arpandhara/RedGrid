import { z } from 'zod';

export const onboardingSchema = z.object({
  body: z.object({
    role: z.enum(['donor', 'hospital', 'organization']),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().optional(),
    
    location: z.object({
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
    }).optional(),

    // Allow these objects to pass through (or define stricter shapes if you prefer)
    donorData: z.any().optional(),
    hospitalData: z.any().optional(),
    orgData: z.any().optional(),
  }),
});
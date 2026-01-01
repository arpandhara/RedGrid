import { z } from 'zod';
import { donorSchema } from './donor.schema.js';
import { hospitalSchema } from './hospital.schema.js';
import { organizationSchema } from './organization.schema.js';

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
      coordinates: z.any().optional(),
    }).optional(),

    // Composed Sub-Schemas
    donorData: donorSchema.optional(),
    hospitalData: hospitalSchema.optional(),
    orgData: organizationSchema.optional(),
  }),
});

import { z } from 'zod';

export const onboardingSchema = z.object({
  body: z.object({
    role: z.enum(['donor', 'organization', 'hospital']),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional().nullable(),
    organizationName: z.string().optional().nullable(),
    location: z.object({
      address: z.string(),
      city: z.string(),
      state: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      }).optional()
    })
  })
}).superRefine((data, ctx) => {
  // Custom Logic: Conditional Requirements
  if (data.body.role === 'donor' && !data.body.bloodGroup) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Blood group is required for donors",
      path: ["body", "bloodGroup"]
    });
  }
  if (['organization', 'hospital'].includes(data.body.role) && !data.body.organizationName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Organization name is required",
      path: ["body", "organizationName"]
    });
  }
});
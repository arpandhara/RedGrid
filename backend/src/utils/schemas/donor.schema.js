
import { z } from 'zod';

export const donorSchema = z.object({
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    dob: z.string().datetime().optional().or(z.string()), // Accept ISO string or plain date string
    gender: z.enum(['male', 'female', 'other']).optional(),

    weight: z.number().optional(),
    lastDonationDate: z.string().datetime().nullable().optional().or(z.string().nullable()),
    isAvailable: z.boolean().optional(),
    healthConditions: z.array(z.string()).optional(),
    medications: z.string().optional(), // Mongoose stores as String

    hasTattooOrPiercing: z.boolean().optional(),
    hasTravelledRecently: z.boolean().optional(),
});


import { z } from 'zod';

export const hospitalSchema = z.object({
    hospitalName: z.string().optional(),
    registrationNumber: z.string().optional(),
    // Allow empty string OR valid URL
    website: z.string().optional(),
    bedsCount: z.number().int().nonnegative().optional().nullable(),
    // Allow empty string OR min 10 chars
    emergencyPhone: z.string().optional(),
    type: z.enum(['government', 'private', 'ngo']).optional(),
}).partial(); // Make ALL fields optional


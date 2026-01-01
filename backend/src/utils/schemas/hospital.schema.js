
import { z } from 'zod';

export const hospitalSchema = z.object({
    hospitalName: z.string().min(2).optional(),
    registrationNumber: z.string().optional(),
    website: z.string().url().optional(),
    bedsCount: z.number().int().nonnegative().optional(),
    emergencyPhone: z.string().min(10).optional(),
    type: z.enum(['government', 'private', 'ngo']).optional(),

});
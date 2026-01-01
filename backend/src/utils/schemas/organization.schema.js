
import { z } from 'zod';

export const organizationSchema = z.object({
    organizationName: z.string().min(2).optional(),
    representativeName: z.string().min(2).optional(),
    licenseNumber: z.string().optional(),
    accountType: z.enum(['permanent', 'temporary']).optional(),

    expiryDate: z.string().datetime().optional().or(z.string()),
});


import { z } from 'zod';

export const organizationSchema = z.object({
    organizationName: z.string().min(2).optional(),
    representativeName: z.string().min(2).optional(),
    licenseNumber: z.string().optional(),
    accountType: z.enum(['NGO', 'Private', 'Government']).optional(),
    expiryDate: z.string().datetime().optional().or(z.string()),
});

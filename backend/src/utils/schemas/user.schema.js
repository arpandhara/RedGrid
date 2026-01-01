
import { z } from 'zod';
import { donorSchema } from './donor.schema.js';
import { hospitalSchema } from './hospital.schema.js';
import { organizationSchema } from './organization.schema.js';

export const userUpdateSchema = z.object({
    body: z.object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
        phone: z.string().min(10).optional(),

        location: z.object({
            address: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            coordinates: z.union([
                z.array(z.number()).length(2), // [lon, lat]
                z.object({ lat: z.number(), lng: z.number() }) // { lat, lng }
            ]).optional()
        }).optional(),

        // Composed Sub-Schemas
        donorData: donorSchema.optional(),
        hospitalData: hospitalSchema.optional(),
        orgData: organizationSchema.optional(),
    })
});

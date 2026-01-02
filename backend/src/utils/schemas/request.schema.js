
import { z } from 'zod';

export const createRequestSchema = z.object({
    body: z.object({
        patientName: z.string().min(2),
        bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
        unitsNeeded: z.number().int().positive(),
        urgency: z.enum(['critical', 'moderate', 'low']),
        location: z.object({
            coordinates: z.array(z.number()).length(2), // [lng, lat]
            type: z.literal('Point').optional().default('Point')
        })
    })
});

export const createDirectRequestSchema = z.object({
    body: z.object({
        recipientId: z.string().min(1), // Mongo ID
        // Accept both cases: 'User', 'user', 'Hospital', etc.
        recipientType: z.enum(['user', 'User', 'hospital', 'Hospital', 'organization', 'Organization']),
        reason: z.string().optional(),
        bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
        patientDetails: z.object({
            name: z.string().optional(),
            age: z.number().optional(),
            gender: z.string().optional()
        }).optional()
    })
});


export const acceptRequestSchema = z.object({
    params: z.object({
        id: z.string().min(1)
    })
});
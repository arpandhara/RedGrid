import express from 'express';
import { getUserById, updateProfile } from '../controllers/userController.js';
// CHANGE THIS LINE:
import { protect } from '../middlewares/authMiddleware.js';
import { requireOnboarding } from '../middlewares/checkOnboarding.js';


import validateResource from '../middlewares/validateResource.js';
import { userUpdateSchema } from '../utils/schemas/user.schema.js';

const router = express.Router();

router.get('/:id', protect, getUserById);
router.put(
    '/profile',
    protect,
    requireOnboarding,
    validateResource(userUpdateSchema),
    updateProfile
);


export default router;
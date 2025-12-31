import express from 'express';
import { getMyNotifications, markAsRead, markAllAsRead, deleteAllNotifications, getUnreadCount } from '../controllers/notificationController.js';
import { protect, loadUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes require login
router.use(loadUser); // Populate req.user for all notification routes

router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount); // New Route
router.delete('/', deleteAllNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

export default router;
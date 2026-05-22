const express = require('express');
const NotificationController = require('./notification.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

const router = express.Router();

/**
 * Notification Routes
 * Base path: /api/notifications
 */

router.use(authMiddleware);

// User routes
router.get('/', NotificationController.getMyNotifications);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

// Admin routes
// GET /api/notifications/admin/all
router.get('/admin/all', roleMiddleware(['admin']), NotificationController.getAllNotifications);

// POST /api/notifications
router.post('/', roleMiddleware(['admin']), NotificationController.createNotification);

module.exports = router;

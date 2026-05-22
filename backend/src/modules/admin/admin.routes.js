const express = require('express');
const AdminController = require('./admin.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

const router = express.Router();

/**
 * Admin & Dashboard Routes
 * Base paths: /api/admin OR /api/dashboard
 */

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// Stats endpoints
router.get('/stats', AdminController.getDashboardStats); // Trùng với /api/dashboard/stats hoặc /api/admin/stats
router.get('/dashboard', AdminController.getDashboardStats); // Trùng với /api/admin/dashboard

// User Management
router.get('/users', AdminController.getAllUsers);
router.patch('/users/:id/status', AdminController.toggleUserStatus);
router.patch('/users/:id/role', AdminController.changeUserRole); // Promote/demote admin

module.exports = router;

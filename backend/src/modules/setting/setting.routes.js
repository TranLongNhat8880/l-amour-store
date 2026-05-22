const express = require('express');
const SettingController = require('./setting.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const upload = require('../../middlewares/upload.middleware');

const router = express.Router();

// Public routes
router.get('/hero', SettingController.getHeroBanner);

// Admin routes
router.put('/hero', authMiddleware, roleMiddleware(['admin']), upload.single('heroImage'), SettingController.updateHeroBanner);

module.exports = router;

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth/auth.routes');
const sessionRoutes = require('./session/session.routes');
const categoryRoutes = require('./category/category.routes');
const productRoutes = require('./product/product.routes');
const userRoutes = require('./user/user.routes');
const notificationRoutes = require('./notification/notification.routes');
const newsletterRoutes = require('./newsletter/newsletter.routes');
const orderRoutes = require('./order/order.routes');
const voucherRoutes = require('./voucher/voucher.routes');
const reviewRoutes = require('./review/review.routes');
const adminRoutes = require('./admin/admin.routes');
const aiRoutes = require('./ai/ai.routes');
const settingRoutes = require('./setting/setting.routes');

// Map các module vào đúng prefix mà Frontend mong đợi
router.use('/auth', authRoutes);
router.use('/sessions', sessionRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/user', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/orders', orderRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/reviews', reviewRoutes);
router.use('/ai', aiRoutes);
router.use('/settings', settingRoutes);

// Phân luồng Admin và Dashboard (Cả 2 đều dùng chung module admin)
router.use('/admin', adminRoutes);
router.use('/dashboard', adminRoutes);

module.exports = router;

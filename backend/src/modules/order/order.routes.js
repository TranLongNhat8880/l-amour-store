const express = require('express');
const OrderController = require('./order.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware);

// User endpoints
router.post('/checkout', OrderController.checkout);
router.get('/my-orders', OrderController.getMyOrders);
router.get('/:id', OrderController.getOrderDetails);

// Admin endpoints
router.get('/', roleMiddleware(['admin']), OrderController.getAllOrders);
router.patch('/:id/status', roleMiddleware(['admin']), OrderController.updateOrderStatus);
router.get('/:id/waybill', roleMiddleware(['admin']), OrderController.generateWaybill);

module.exports = router;

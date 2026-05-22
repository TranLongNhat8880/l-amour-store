const express = require('express');
const VoucherController = require('./voucher.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

const router = express.Router();

// Public/User routes
router.post('/validate', VoucherController.validateVoucher);
router.get('/my-vouchers', authMiddleware, VoucherController.getMyVouchers);

// Admin routes
router.get('/', authMiddleware, roleMiddleware(['admin']), VoucherController.getAllVouchers);
router.post('/', authMiddleware, roleMiddleware(['admin']), VoucherController.createVoucher);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), VoucherController.deleteVoucher);

module.exports = router;

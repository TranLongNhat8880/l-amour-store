const express = require('express');
const UserController = require('./user.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

const router = express.Router();

// Tất cả route trong đây đều cần login
router.use(authMiddleware);

router.get('/profile', UserController.getProfile);
router.put('/profile', upload.single('avatar'), UserController.updateProfile);
router.put('/change-password', UserController.changePassword);

// Address Book
router.get('/addresses', UserController.getAddresses);
router.post('/addresses', UserController.addAddress);
router.put('/addresses/:addressId', UserController.updateAddress);
router.delete('/addresses/:addressId', UserController.deleteAddress);
router.patch('/addresses/:addressId/default', UserController.setDefaultAddress);

module.exports = router;

const express = require('express');
const ReviewController = require('./review.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const reviewSchemas = require('./review.validation');

const router = express.Router();

/**
 * Review Routes
 * Base path: /api/reviews
 */

// Admin: Lấy tất cả đánh giá (GET /api/reviews)
router.get('/', authMiddleware, roleMiddleware(['admin']), ReviewController.getAllReviews);

// Public: Xem reviews của 1 sản phẩm (GET /api/reviews/:productId)
router.get('/:productId', ReviewController.getProductReviews);

// User: Viết review (POST /api/reviews)
router.post('/', authMiddleware, validate(reviewSchemas.create), ReviewController.createReview);

// User/Admin: Xóa review (DELETE /api/reviews/:id)
router.delete('/:id', authMiddleware, ReviewController.deleteReview);

module.exports = router;

const ReviewService = require('./review.service');
const { success } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const ReviewController = {
    getProductReviews: asyncHandler(async (req, res) => {
        const reviews = await ReviewService.getProductReviews(req.params.productId);
        return success(res, 'Đánh giá sản phẩm', reviews);
    }),

    getAllReviews: asyncHandler(async (req, res) => {
        const reviews = await ReviewService.getAllReviews();
        return success(res, 'Tất cả đánh giá', reviews);
    }),

    createReview: asyncHandler(async (req, res) => {
        const { product_id, rating, comment } = req.body;
        const id = await ReviewService.createReview(req.user.id, product_id, rating, comment);
        return success(res, 'Đánh giá thành công', { id }, 201);
    }),

    deleteReview: asyncHandler(async (req, res) => {
        await ReviewService.deleteReview(req.params.id, req.user.id, req.user.role === 'admin');
        return success(res, 'Xóa đánh giá thành công');
    })
};

module.exports = ReviewController;

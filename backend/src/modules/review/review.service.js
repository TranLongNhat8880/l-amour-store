const ReviewModel = require('./review.model');

const ReviewService = {
    async getProductReviews(productId) {
        return await ReviewModel.findByProductId(productId);
    },

    async getAllReviews() {
        return await ReviewModel.findAll();
    },

    async createReview(userId, productId, rating, comment) {
        // Business rule: chỉ review sản phẩm đã mua và nhận thành công
        const hasPurchased = await ReviewModel.hasUserPurchasedProduct(userId, productId);
        if (!hasPurchased) {
            const err = new Error('Bạn chỉ có thể đánh giá sản phẩm đã mua và đã nhận hàng thành công');
            err.statusCode = 403;
            throw err;
        }

        // Business rule: mỗi user chỉ review 1 lần mỗi sản phẩm
        const existing = await ReviewModel.findByUserAndProduct(userId, productId);
        if (existing) {
            const err = new Error('Bạn đã đánh giá sản phẩm này rồi');
            err.statusCode = 400;
            throw err;
        }

        return await ReviewModel.create({ user_id: userId, product_id: productId, rating, comment });
    },

    async deleteReview(reviewId, userId, isAdmin) {
        // Admin bypass ownership check
        const affected = await ReviewModel.delete(reviewId, isAdmin ? null : userId);
        if (!affected) {
            const err = new Error('Không tìm thấy đánh giá hoặc bạn không có quyền xóa');
            err.statusCode = 404;
            throw err;
        }
    }
};

module.exports = ReviewService;

const NewsletterService = require('./newsletter.service');
const { success, error } = require('../../utils/response');

const NewsletterController = {
    async subscribe(req, res) {
        try {
            const { email, user_id } = req.body;

            if (!email || !email.includes('@')) {
                return error(res, 'Email không hợp lệ', 400);
            }

            const result = await NewsletterService.subscribe(email, user_id);
            return success(res, result.message, { coupon: result.coupon });
        } catch (err) {
            console.error('Newsletter Error:', err);
            return error(res, 'Lỗi hệ thống khi đăng ký bản tin', 500);
        }
    }
};

module.exports = NewsletterController;

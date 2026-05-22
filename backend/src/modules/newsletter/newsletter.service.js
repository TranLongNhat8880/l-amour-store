const NewsletterModel = require('./newsletter.model');
const VoucherModel = require('../voucher/voucher.model');
const pool = require('../../config/database');
const generateId = require('../../utils/generateId');

const NewsletterService = {
    /**
     * Đăng ký nhận bản tin. Nếu user đã đăng nhập thì tặng voucher LAMOUR10.
     * @returns {{ message: string, coupon: string }}
     */
    async subscribe(email, userId = null) {
        // 1. Lưu email vào Newsletters nếu chưa có
        const existing = await NewsletterModel.findByEmail(email);
        if (!existing) {
            await NewsletterModel.create(email);
        }

        // 2. Tặng voucher LAMOUR10 nếu có user đang đăng nhập
        let couponMsg = '';
        if (userId) {
            const voucher = await VoucherModel.findByCode('LAMOUR10');
            if (voucher) {
                try {
                    const uvId = generateId();
                    await pool.query(
                        'INSERT INTO User_Vouchers (id, user_id, voucher_id, is_used) VALUES (?, ?, ?, FALSE)',
                        [uvId, userId, voucher.id]
                    );
                    couponMsg = 'Voucher LAMOUR10 đã được thêm vào kho quà tặng của bạn!';
                } catch {
                    // Duplicate entry — user đã có voucher này rồi
                    couponMsg = 'Bạn đã sở hữu voucher LAMOUR10 trong kho quà tặng.';
                }
            }
        }

        return {
            message: `Đăng ký thành công! ${couponMsg}`.trim(),
            coupon: 'LAMOUR10'
        };
    }
};

module.exports = NewsletterService;

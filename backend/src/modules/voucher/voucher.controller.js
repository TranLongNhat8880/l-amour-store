const VoucherService = require('./voucher.service');
const { success, error } = require('../../utils/response');

const VoucherController = {
    async getAllVouchers(req, res) {
        try {
            const vouchers = await VoucherService.getAllVouchers();
            return success(res, 'Danh sách voucher', vouchers);
        } catch (err) {
            return error(res, 'Server Error', 500);
        }
    },

    async createVoucher(req, res) {
        try {
            const { code, discount_type, discount_value, usage_limit, expiry_date } = req.body;
            if (!code || !discount_value || !expiry_date) {
                return error(res, 'Thiếu thông tin voucher (code, discount_value, expiry_date)', 400);
            }
            const id = await VoucherService.createVoucher({ code, discount_type, discount_value, usage_limit, expiry_date });
            return success(res, 'Tạo voucher thành công', { id }, 201);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') return error(res, 'Mã voucher đã tồn tại', 400);
            return error(res, 'Server Error', 500);
        }
    },

    async deleteVoucher(req, res) {
        try {
            await VoucherService.deleteVoucher(req.params.id);
            return success(res, 'Đã xóa voucher thành công');
        } catch (err) {
            if (err.message === 'Voucher không tồn tại') return error(res, err.message, 404);
            return error(res, 'Server Error', 500);
        }
    },

    async validateVoucher(req, res) {
        try {
            const { code, total_amount } = req.body;
            if (!code || !total_amount) return error(res, 'Cần cung cấp code và total_amount', 400);

            const result = await VoucherService.validateVoucher(code, total_amount);
            return success(res, 'Voucher hợp lệ', result);
        } catch (err) {
            const clientErrors = ['không tồn tại', 'hết hạn', 'hết lượt'];
            const isClient = clientErrors.some(e => err.message.includes(e));
            return error(res, err.message, isClient ? 400 : 500);
        }
    },

    async getMyVouchers(req, res) {
        try {
            const vouchers = await VoucherService.getMyVouchers(req.user.id);
            return success(res, 'Danh sách voucher của bạn', vouchers);
        } catch (err) {
            return error(res, 'Server Error', 500);
        }
    }
};

module.exports = VoucherController;

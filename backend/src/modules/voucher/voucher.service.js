const VoucherModel = require('./voucher.model');

const VoucherService = {
    async getAllVouchers() {
        return await VoucherModel.findAll();
    },

    async createVoucher(data) {
        const { code, discount_type, discount_value, usage_limit, expiry_date } = data;
        const id = await VoucherModel.create({ code, discount_type, discount_value, usage_limit, expiry_date });
        return id;
    },

    async deleteVoucher(id) {
        const affected = await VoucherModel.delete(id);
        if (affected === 0) throw new Error('Voucher không tồn tại');
    },

    async validateVoucher(code, totalAmount) {
        const voucher = await VoucherModel.findByCode(code);
        if (!voucher) throw new Error('Voucher không tồn tại');
        if (new Date(voucher.expiry_date) < new Date()) throw new Error('Voucher đã hết hạn');
        if (voucher.usage_limit <= 0) throw new Error('Voucher đã hết lượt sử dụng');

        let discountAmount = 0;
        if (voucher.discount_type === 'percent') {
            discountAmount = (parseFloat(totalAmount) * parseFloat(voucher.discount_value)) / 100;
        } else {
            discountAmount = parseFloat(voucher.discount_value);
        }

        const finalAmount = Math.max(0, parseFloat(totalAmount) - discountAmount);
        return {
            discount_amount: discountAmount,
            final_amount: finalAmount,
            discount_type: voucher.discount_type,
            discount_value: voucher.discount_value
        };
    },

    async getMyVouchers(userId) {
        return await VoucherModel.findMyVouchers(userId);
    }
};

module.exports = VoucherService;

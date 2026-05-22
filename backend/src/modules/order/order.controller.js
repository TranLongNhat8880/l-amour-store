const OrderService = require('./order.service');
const { success, error } = require('../../utils/response');

const OrderController = {

    // ==================== USER ENDPOINTS ====================

    /**
     * POST /api/orders/checkout
     * Đặt hàng - kích hoạt Race Condition Handling & Voucher logic
     */
    async checkout(req, res) {
        try {
            const { items, voucher_code, is_discreet_shipping, shipping_info } = req.body;
            const user_id = req.user.id;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return error(res, 'Giỏ hàng không được để trống', 400);
            }

            if (!shipping_info || !shipping_info.full_name || !shipping_info.phone || !shipping_info.address_line || !shipping_info.city) {
                return error(res, 'Thiếu thông tin giao hàng', 400);
            }

            // Validate items format
            for (const item of items) {
                if (!item.variant_id || !item.quantity || item.quantity < 1) {
                    return error(res, 'Định dạng sản phẩm không hợp lệ (cần variant_id và quantity)', 400);
                }
            }

            const order_id = await OrderService.placeOrder(
                user_id,
                items,
                voucher_code || null,
                is_discreet_shipping || false,
                shipping_info
            );

            return success(res, 'Đặt hàng thành công!', { order_id }, 201);
        } catch (err) {
            // Lỗi hết hàng, hết voucher, etc. -> 400
            const isClientError = err.message.includes('không đủ') ||
                err.message.includes('Voucher') ||
                err.message.includes('không tồn tại');
            return error(res, err.message, isClientError ? 400 : 500);
        }
    },

    /**
     * GET /api/orders/my-orders
     * Lịch sử đơn hàng của user hiện tại
     */
    async getMyOrders(req, res) {
        try {
            const orders = await OrderService.getMyOrders(req.user.id);
            return success(res, 'Lịch sử đơn hàng', orders);
        } catch (err) {
            return error(res, 'Server Error', 500);
        }
    },

    /**
     * GET /api/orders/:id
     * Xem chi tiết 1 đơn hàng
     */
    async getOrderDetails(req, res) {
        try {
            const order = await OrderService.getOrderDetails(
                req.params.id,
                req.user.id,
                req.user.role
            );
            return success(res, 'Chi tiết đơn hàng', order);
        } catch (err) {
            const isPermission = err.message.includes('quyền');
            return error(res, err.message, isPermission ? 403 : 404);
        }
    },

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * GET /api/orders (Admin)
     * Lấy tất cả đơn hàng, có thể lọc theo status
     */
    async getAllOrders(req, res) {
        try {
            const filters = { status: req.query.status };
            const orders = await OrderService.getAllOrders(filters);
            return success(res, 'Danh sách đơn hàng', orders);
        } catch (err) {
            return error(res, 'Server Error', 500);
        }
    },

    /**
     * PATCH /api/orders/:id/status (Admin)
     * Cập nhật trạng thái đơn hàng: pending -> preparing -> shipping -> completed / cancelled
     */
    async updateOrderStatus(req, res) {
        try {
            const { status } = req.body;
            if (!status) return error(res, 'Trạng thái không được để trống', 400);

            await OrderService.updateOrderStatus(req.params.id, status);
            return success(res, 'Cập nhật trạng thái đơn hàng thành công');
        } catch (err) {
            const isValidation = err.message.includes('hợp lệ') || err.message.includes('tồn tại');
            return error(res, err.message, isValidation ? 400 : 500);
        }
    },

    /**
     * GET /api/orders/:id/waybill (Admin)
     * Xuất phiếu giao hàng - Kích hoạt Discreet Shipping Masking
     */
    async generateWaybill(req, res) {
        try {
            const waybill = await OrderService.generateWaybill(req.params.id);
            return success(res, 'Phiếu giao hàng', waybill);
        } catch (err) {
            return error(res, err.message, 404);
        }
    }
};

module.exports = OrderController;

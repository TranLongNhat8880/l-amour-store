const pool = require('../../config/database');
const OrderModel = require('./order.model');
const VoucherModel = require('../voucher/voucher.model');
const NotificationModel = require('../notification/notification.model');
const UserModel = require('../user/user.model');

const OrderService = {
    /**
     * GIẢI THUẬT XÁC THỰC VÀ ÁP DỤNG VOUCHER
     * Kiểm tra tính hợp lệ của voucher và trả về số tiền cuối cùng
     * @param {string} code - Voucher code
     * @param {number} totalAmount - Tổng tiền gốc
     */
    async validateVoucher(code, totalAmount) {
        if (!code) return { voucher: null, finalAmount: totalAmount, discount_amount: 0 };

        // Check 1: Voucher tồn tại không?
        const voucher = await VoucherModel.findByCode(code);
        if (!voucher) {
            throw new Error('Voucher không tồn tại');
        }

        // Check 2: Còn hạn sử dụng không?
        if (new Date(voucher.expiry_date) < new Date()) {
            throw new Error('Voucher đã hết hạn sử dụng');
        }

        // Check 3: Còn lượt sử dụng không?
        if (voucher.usage_limit <= 0) {
            throw new Error('Voucher đã hết lượt sử dụng');
        }

        // Tính số tiền giảm
        let discountAmount = 0;
        if (voucher.discount_type === 'percent') {
            discountAmount = (parseFloat(totalAmount) * parseFloat(voucher.discount_value)) / 100;
        } else {
            discountAmount = parseFloat(voucher.discount_value);
        }

        // Tính tiền sau giảm, chặn số âm
        const finalAmount = Math.max(0, parseFloat(totalAmount) - discountAmount);

        return { voucher, finalAmount, discount_amount: discountAmount };
    },

    /**
     * GIẢI THUẬT XỬ LÝ TƯƠNG TRANH KHI ĐẶT HÀNG (RACE CONDITION HANDLING)
     * Sử dụng MySQL Transaction + SELECT ... FOR UPDATE để khóa dòng
     * @param {number} user_id
     * @param {Array} items - [{ variant_id, quantity }]
     * @param {string|null} voucher_code
     * @param {boolean} is_discreet_shipping
     * @param {Object} shipping_info
     */
    async placeOrder(user_id, items, voucher_code, is_discreet_shipping, shipping_info = {}) {
        // Lấy một connection riêng để thực hiện transaction
        const connection = await pool.getConnection();

        try {
            // === BƯỚC 1: BẮT ĐẦU TRANSACTION ===
            await connection.beginTransaction();

            let rawTotal = 0;
            const processedItems = [];

            // === BƯỚC 2: DUYỆT QUA TỪNG MÓN HÀNG, KHÓA DÒNG VÀ KIỂM TRA TỒN KHO ===
            for (const item of items) {
                // SELECT ... FOR UPDATE: Khóa dòng sản phẩm này lại
                // Nếu có user khác đang xử lý cùng variant này, request sẽ phải đợi
                const variant = await OrderModel.getVariantForUpdate(connection, item.variant_id);

                if (!variant) {
                    throw new Error(`Sản phẩm (variant_id: ${item.variant_id}) không tồn tại`);
                }

                // Kiểm tra tồn kho thực tế
                if (variant.stock < item.quantity) {
                    throw new Error(
                        `Sản phẩm "${variant.color || ''} - Size ${variant.size || ''}" không đủ số lượng trong kho (còn ${variant.stock})`
                    );
                }

                rawTotal += parseFloat(variant.price) * item.quantity;
                processedItems.push({
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    unit_price: variant.price
                });
            }

            // === BƯỚC 3: XÁC THỰC VÀ ÁP DỤNG VOUCHER ===
            const { voucher, finalAmount: subtotalAfterDiscount } = await this.validateVoucher(voucher_code, rawTotal);

            // === BƯỚC 4: TÍNH TỔNG TIỀN (BAO GỒM PHÍ SHIP) ===
            // Voucher chỉ áp dụng trên giá trị sản phẩm, không áp dụng cho phí ship
            const SHIPPING_FEE = 35000;
            const total_amount = subtotalAfterDiscount + SHIPPING_FEE;

            // === BƯỚC 5: TẠO ĐƠN HÀNG ===
            const order_id = await OrderModel.createOrder(connection, {
                user_id,
                voucher_id: voucher ? voucher.id : null,
                total_amount: total_amount,
                is_discreet_shipping: !!is_discreet_shipping,
                shipping_info
            });

            // === BƯỚC 6: LƯU CHI TIẾT ĐƠN HÀNG & TRỪ TỒN KHO ===
            for (const item of processedItems) {
                await OrderModel.addOrderDetail(connection, {
                    order_id,
                    ...item
                });

                // Trừ tồn kho
                await OrderModel.decreaseStock(connection, item.variant_id, item.quantity);
            }

            // === BƯỚC 7: TRỪ LƯỢT SỬ DỤNG VOUCHER ===
            if (voucher) {
                await VoucherModel.decrementUsage(voucher.id, connection);
            }

            // === BƯỚC 8: COMMIT - XÁC NHẬN TOÀN BỘ GIAO DỊCH ===
            await connection.commit();

            // === BƯỚC 9: THÔNG BÁO CHO ADMIN ===
            try {
                const admins = await UserModel.findAdmins();
                const adminIds = admins.map(a => a.id);
                if (adminIds.length > 0) {
                    await NotificationModel.create({
                        title: 'Đơn hàng mới!',
                        content: `Đơn hàng #${order_id.substring(0, 8)} vừa được đặt và đang chờ xác nhận.`,
                        type: 'order',
                        is_global: false,
                        user_id: adminIds
                    });
                    
                    // Phát tín hiệu admin_update để cập nhật badge Đơn hàng ngay lập tức
                    const { notifyAdmins } = require('../../config/socket');
                    notifyAdmins({ type: 'new_order', order_id });
                }
            } catch (notifyErr) {
                console.error('Failed to notify admins about new order:', notifyErr);
            }

            return order_id;

        } catch (err) {
            // NẾU BẤT KỲ BƯỚC NÀO THẤT BẠI: ROLLBACK, HỦY TOÀN BỘ, NHƯỜNG CHỖ CHO USER KHÁC
            await connection.rollback();
            throw err;
        } finally {
            // LUÔN LUÔN NHẢ CONNECTION VỀ POOL
            connection.release();
        }
    },

    async getMyOrders(user_id) {
        return await OrderModel.findOrdersByUserId(user_id);
    },

    async getOrderDetails(order_id, user_id, role) {
        const order = await OrderModel.findOrderById(order_id);
        if (!order) throw new Error('Đơn hàng không tồn tại');

        // User chỉ được xem đơn của chính mình, Admin xem được tất cả
        if (role !== 'admin' && order.user_id !== user_id) {
            throw new Error('Bạn không có quyền xem đơn hàng này');
        }

        const details = await OrderModel.findOrderDetails(order_id);
        order.items = details;
        return order;
    },

    /**
     * GIẢI THUẬT ẨN DANH VẬN ĐƠN (DISCREET SHIPPING MASKING)
     * Thay thế tên sản phẩm nhạy cảm trên phiếu giao hàng
     */
    async generateWaybill(order_id) {
        const order = await OrderModel.findOrderById(order_id);
        if (!order) throw new Error('Đơn hàng không tồn tại');

        const details = await OrderModel.findOrderDetails(order_id);

        const waybillItems = details.map(item => {
            let displayName = item.product_name;

            // Nếu đơn có kích hoạt Discreet Shipping VÀ sản phẩm thuộc danh mục nhạy cảm
            if (order.is_discreet_shipping && item.is_age_restricted) {
                displayName = 'Phụ kiện thời trang'; // Ghi đè tên
            }

            return {
                product_name: displayName,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                unit_price: item.unit_price
            };
        });

        return {
            order_id: order.id,
            created_at: order.created_at,
            total_amount: order.total_amount,
            is_discreet_shipping: order.is_discreet_shipping,
            shipping: {
                full_name: order.shipping_full_name,
                phone: order.shipping_phone,
                email: order.shipping_email,
                address_line: order.shipping_address_line,
                city: order.shipping_city,
                district: order.shipping_district
            },
            items: waybillItems
        };
    },

    // Admin functions
    async getAllOrders(filters) {
        return await OrderModel.getAllOrders(filters);
    },

    async updateOrderStatus(order_id, status) {
        const VALID_STATUSES = ['pending', 'preparing', 'shipping', 'completed', 'cancelled'];
        if (!VALID_STATUSES.includes(status)) {
            throw new Error('Trạng thái không hợp lệ');
        }

        const order = await OrderModel.findOrderById(order_id);
        if (!order) throw new Error('Đơn hàng không tồn tại');

        // Bỏ qua nếu trạng thái không đổi
        if (order.status === status) return true;

        // Nếu trạng thái mới là cancelled, hoàn lại số lượng tồn kho
        if (status === 'cancelled') {
            const details = await OrderModel.findOrderDetails(order_id);
            for (const item of details) {
                await OrderModel.increaseStock(item.variant_id, item.quantity);
            }
        }

        await OrderModel.updateOrderStatus(order_id, status);

        // === THÔNG BÁO CHO USER KHI TRẠNG THÁI THAY ĐỔI ===
        try {
            const statusMap = {
                'preparing': 'đang được xử lý',
                'shipping': 'đang được giao đi',
                'completed': 'đã hoàn thành',
                'cancelled': 'đã bị hủy'
            };
            
            const statusText = statusMap[status] || status;
            await NotificationModel.create({
                title: 'Cập nhật đơn hàng',
                content: `Đơn hàng #${order_id.substring(0, 8)} của bạn ${statusText}.`,
                type: 'order',
                is_global: false,
                user_id: order.user_id
            });
        } catch (notifyErr) {
            console.error('Failed to notify user about status update:', notifyErr);
        }

        return true;
    }
};

module.exports = OrderService;

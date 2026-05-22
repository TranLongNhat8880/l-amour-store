const cron = require('node-cron');
const OrderModel = require('../modules/order/order.model');
const OrderService = require('../modules/order/order.service');

const initCronJobs = () => {
    // Chạy mỗi 15 phút một lần: */15 * * * *
    cron.schedule('*/15 * * * *', async () => {
        try {
            console.log('[CRON] Bắt đầu quét đơn hàng chờ xác nhận quá hạn...');
            
            // Lấy các đơn hàng 'pending' đã tạo cách đây hơn 5 tiếng
            const expiredOrders = await OrderModel.getExpiredPendingOrders(5);
            
            if (expiredOrders.length === 0) {
                return;
            }

            console.log(`[CRON] Tìm thấy ${expiredOrders.length} đơn hàng quá 5 tiếng. Đang tiến hành hủy...`);

            for (const order of expiredOrders) {
                try {
                    // Chuyển trạng thái sang 'cancelled'
                    // Hàm updateOrderStatus đã được code để tự động: 
                    // 1. Chuyển status 
                    // 2. Hoàn lại số lượng tồn kho (restock)
                    // 3. Gửi notification cho user
                    await OrderService.updateOrderStatus(order.id, 'cancelled');
                    console.log(`[CRON] Đã hủy tự động đơn hàng: ${order.id}`);
                } catch (err) {
                    console.error(`[CRON] Lỗi khi hủy đơn ${order.id}:`, err.message);
                }
            }
            
            console.log('[CRON] Hoàn tất quét và hủy đơn.');
        } catch (error) {
            console.error('[CRON] Lỗi hệ thống khi chạy CRON Job:', error);
        }
    });

    console.log('[CRON] Đã khởi tạo các tác vụ chạy ngầm.');
};

module.exports = { initCronJobs };

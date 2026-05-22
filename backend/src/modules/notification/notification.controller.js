const NotificationModel = require('./notification.model');
const { success, error } = require('../../utils/response');

const NotificationController = {
    // User lấy thông báo của mình
    async getMyNotifications(req, res) {
        try {
            const notifications = await NotificationModel.findForUser(req.user.id);
            const unread_count = await NotificationModel.countUnread(req.user.id);
            return success(res, 'Danh sách thông báo', { unread_count, notifications });
        } catch (err) {
            return error(res, 'Server Error', 500);
        }
    },

    // User đánh dấu 1 thông báo đã đọc
    async markAsRead(req, res) {
        try {
            await NotificationModel.markAsRead(req.params.id, req.user.id);
            return success(res, 'Đã đánh dấu đã đọc');
        } catch (err) {
            return error(res, 'Server Error', 500);
        }
    },

    // User đánh dấu tất cả đã đọc
    async markAllAsRead(req, res) {
        try {
            await NotificationModel.markAllAsRead(req.user.id);
            return success(res, 'Đã đánh dấu tất cả đã đọc');
        } catch (err) {
            return error(res, 'Server Error', 500);
        }
    },

    // Admin lấy danh sách thông báo đã tạo (có phân trang)
    async getAllNotifications(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const total = await NotificationModel.countAll();
            const notifications = await NotificationModel.findAll(limit, offset);

            return success(res, 'Danh sách thông báo hệ thống', {
                notifications,
                pagination: {
                    total,
                    page,
                    limit,
                    total_pages: Math.ceil(total / limit)
                }
            });
        } catch (err) {
            console.error('GetAllNotifications Error:', err);
            return error(res, 'Server Error', 500);
        }
    },

    // Admin tạo thông báo mới
    async createNotification(req, res) {
        try {
            const { title, content, type, is_global, user_id } = req.body;
            if (!title || !content) {
                return error(res, 'title và content không được để trống', 400);
            }

            const id = await NotificationModel.create({
                title,
                content,
                type: type || 'general',
                is_global: is_global !== false,
                user_id: user_id || null, // Có thể là 1 string hoặc 1 array
                created_by: req.user.id
            });

            return success(res, 'Tạo thông báo thành công', { id }, 201);
        } catch (err) {
            return error(res, 'Server Error', 500);
        }
    }
};

module.exports = NotificationController;

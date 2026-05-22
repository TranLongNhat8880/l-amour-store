const AdminService = require('./admin.service');
const { success, error } = require('../../utils/response');

const AdminController = {
    async getDashboardStats(req, res) {
        try {
            const data = await AdminService.getDashboardStats();
            return success(res, 'Dashboard stats retrieved', data);
        } catch (err) {
            console.error('Dashboard Stats Error:', err);
            return error(res, 'Lỗi khi lấy dữ liệu thống kê', 500);
        }
    },

    async getAllUsers(req, res) {
        try {
            const users = await AdminService.getAllUsers();
            return success(res, 'Users retrieved', users);
        } catch (err) {
            return error(res, 'Lỗi khi lấy danh sách người dùng', 500);
        }
    },

    async toggleUserStatus(req, res) {
        try {
            const newStatus = await AdminService.toggleUserStatus(req.params.id, req.body.is_active);
            return success(res, newStatus ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
        } catch (err) {
            if (err.message.includes('không thể') || err.message.includes('không tìm')) {
                return error(res, err.message, err.message.includes('không tìm') ? 404 : 403);
            }
            return error(res, 'Lỗi khi thay đổi trạng thái người dùng', 500);
        }
    },

    async changeUserRole(req, res) {
        try {
            const result = await AdminService.changeUserRole(req.params.id, req.body.role, req.user.id);
            const message = req.body.role === 'admin'
                ? `Đã cấp quyền Admin cho ${result.full_name}`
                : `Đã thu hồi quyền Admin của ${result.full_name}`;
            return success(res, message, { id: result.id, email: result.email, new_role: result.new_role });
        } catch (err) {
            console.error('Change Role Error:', err);
            const isClient = ['không hợp lệ', 'không thể', 'không tìm', 'đã có role'].some(e => err.message.includes(e));
            return error(res, err.message, isClient ? 400 : 500);
        }
    }
};

module.exports = AdminController;

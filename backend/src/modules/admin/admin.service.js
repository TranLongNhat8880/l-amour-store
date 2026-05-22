const AdminModel = require('./admin.model');

const AdminService = {
    async getDashboardStats() {
        const [kpis, order_counts, chart, low_stock_products, recent_orders] = await Promise.all([
            AdminModel.getKpis(),
            AdminModel.getOrderCounts(),
            AdminModel.getRevenueChart(),
            AdminModel.getLowStockProducts(),
            AdminModel.getRecentOrders()
        ]);
        return { kpis, order_counts, chart, low_stock_products, recent_orders };
    },

    async getAllUsers() {
        return await AdminModel.getAllUsers();
    },

    async toggleUserStatus(id, isActive) {
        const user = await AdminModel.findUserById(id);
        if (!user) throw new Error('Không tìm thấy người dùng');
        if (user.role === 'admin') throw new Error('Không thể khóa tài khoản quản trị viên');

        const newStatus = (isActive !== undefined) ? (isActive ? 1 : 0) : (user.is_active ? 0 : 1);
        await AdminModel.updateUserStatus(id, newStatus);
        return newStatus;
    },

    async changeUserRole(id, role, requesterId) {
        if (!['admin', 'user'].includes(role)) throw new Error("Role không hợp lệ. Chỉ chấp nhận 'admin' hoặc 'user'");
        if (parseInt(id) === requesterId) throw new Error('Bạn không thể thay đổi role của chính mình');

        const target = await AdminModel.findUserById(id);
        if (!target) throw new Error('Không tìm thấy người dùng');
        if (target.role === role) throw new Error(`Người dùng này đã có role '${role}' rồi`);

        await AdminModel.updateUserRole(id, role);
        return { id: target.id, email: target.email, full_name: target.full_name, new_role: role };
    }
};

module.exports = AdminService;

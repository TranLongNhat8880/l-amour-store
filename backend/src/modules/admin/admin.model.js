const pool = require('../../config/database');

const AdminModel = {
    // ── Dashboard KPIs ────────────────────────────────────────────────────
    async getKpis() {
        const [[{ total_revenue }]] = await pool.query(
            `SELECT SUM(total_amount) as total_revenue FROM Orders WHERE status = 'completed'`
        );
        const [[{ total_orders }]] = await pool.query(
            `SELECT COUNT(*) as total_orders FROM Orders WHERE status != 'cancelled'`
        );
        const [[{ total_products }]] = await pool.query(
            `SELECT COUNT(*) as total_products FROM Products`
        );
        const [[{ total_users }]] = await pool.query(
            `SELECT COUNT(*) as total_users FROM Users WHERE role = 'user'`
        );
        return { total_revenue: total_revenue || 0, total_orders, total_products, total_users };
    },

    async getOrderCounts() {
        const [[{ pending }]] = await pool.query(`SELECT COUNT(*) AS pending FROM Orders WHERE status = 'pending'`);
        const [[{ preparing }]] = await pool.query(`SELECT COUNT(*) AS preparing FROM Orders WHERE status = 'preparing'`);
        const [[{ shipping }]] = await pool.query(`SELECT COUNT(*) AS shipping FROM Orders WHERE status = 'shipping'`);
        return { pending, preparing, shipping };
    },

    async getRevenueChart() {
        const [rows] = await pool.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total_amount) as revenue
            FROM Orders
            WHERE status = 'completed' AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `);
        return rows;
    },

    async getLowStockProducts() {
        const [rows] = await pool.query(`
            SELECT pv.id, pv.size, pv.color, pv.stock, p.name AS product_name
            FROM Product_Variants pv
            JOIN Products p ON pv.product_id = p.id
            WHERE pv.stock <= 5
            ORDER BY pv.stock ASC
            LIMIT 10
        `);
        return rows;
    },

    async getRecentOrders() {
        const [rows] = await pool.query(`
            SELECT o.id, o.total_amount, o.status, o.created_at, u.full_name, u.email
            FROM Orders o
            JOIN Users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 5
        `);
        return rows;
    },

    // ── User Management ───────────────────────────────────────────────────
    async getAllUsers() {
        const [rows] = await pool.query(`
            SELECT id, email, full_name, phone, address, role, is_active, created_at
            FROM Users
            ORDER BY role ASC, created_at DESC
        `);
        return rows;
    },

    async findUserById(id) {
        const [[user]] = await pool.query(`SELECT id, full_name, email, role, is_active FROM Users WHERE id = ?`, [id]);
        return user || null;
    },

    async updateUserStatus(id, isActive) {
        await pool.query(`UPDATE Users SET is_active = ? WHERE id = ?`, [isActive, id]);
    },

    async updateUserRole(id, role) {
        await pool.query(`UPDATE Users SET role = ? WHERE id = ?`, [role, id]);
    }
};

module.exports = AdminModel;

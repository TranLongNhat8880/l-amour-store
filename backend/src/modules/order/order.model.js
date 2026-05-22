const pool = require('../../config/database');
const generateId = require('../../utils/generateId');

const OrderModel = {
    async createOrder(connection, orderData) {
        const { user_id, voucher_id, total_amount, is_discreet_shipping, shipping_info = {} } = orderData;
        const id = generateId();
        await connection.query(
            `INSERT INTO Orders (
                id, user_id, voucher_id, total_amount, is_discreet_shipping,
                shipping_full_name, shipping_phone, shipping_email,
                shipping_address_line, shipping_city, shipping_district
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                user_id,
                voucher_id || null,
                total_amount,
                is_discreet_shipping || false,
                shipping_info.full_name || null,
                shipping_info.phone || null,
                shipping_info.email || null,
                shipping_info.address_line || null,
                shipping_info.city || null,
                shipping_info.district || null
            ]
        );
        return id;
    },

    async addOrderDetail(connection, detailData) {
        const { order_id, variant_id, quantity, unit_price } = detailData;
        const id = generateId();
        await connection.query(
            'INSERT INTO Order_Details (id, order_id, variant_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
            [id, order_id, variant_id, quantity, unit_price]
        );
        return id;
    },

    async getVariantForUpdate(connection, variant_id) {
        // SELECT ... FOR UPDATE: Locks the row to prevent race conditions
        const [rows] = await connection.query(
            'SELECT * FROM Product_Variants WHERE id = ? FOR UPDATE',
            [variant_id]
        );
        return rows[0];
    },

    async decreaseStock(connection, variant_id, quantity) {
        const [result] = await connection.query(
            'UPDATE Product_Variants SET stock = stock - ? WHERE id = ?',
            [quantity, variant_id]
        );
        return result.affectedRows;
    },

    async increaseStock(variant_id, quantity) {
        const [result] = await pool.query(
            'UPDATE Product_Variants SET stock = stock + ? WHERE id = ?',
            [quantity, variant_id]
        );
        return result.affectedRows;
    },

    async findOrdersByUserId(user_id) {
        const [rows] = await pool.query(`
            SELECT o.*, v.code AS voucher_code
            FROM Orders o
            LEFT JOIN Vouchers v ON o.voucher_id = v.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        `, [user_id]);
        return rows;
    },

    async findOrderById(order_id) {
        const [rows] = await pool.query(`
            SELECT o.*, v.code AS voucher_code
            FROM Orders o
            LEFT JOIN Vouchers v ON o.voucher_id = v.id
            WHERE o.id = ?
        `, [order_id]);
        return rows[0];
    },

    async findOrderDetails(order_id) {
        const [rows] = await pool.query(`
            SELECT od.*,
                pv.size, pv.color, pv.image_url AS variant_image, pv.product_id,
                p.name AS product_name, p.thumbnail_url,
                c.is_age_restricted, c.name AS category_name
            FROM Order_Details od
            JOIN Product_Variants pv ON od.variant_id = pv.id
            JOIN Products p ON pv.product_id = p.id
            JOIN Categories c ON p.category_id = c.id
            WHERE od.order_id = ?
        `, [order_id]);
        return rows;
    },

    async getAllOrders(filters = {}) {
        let query = `
            SELECT o.*, u.full_name, u.email, v.code AS voucher_code
            FROM Orders o
            JOIN Users u ON o.user_id = u.id
            LEFT JOIN Vouchers v ON o.voucher_id = v.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ' AND o.status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY o.created_at DESC';
        const [rows] = await pool.query(query, params);
        return rows;
    },

    async getExpiredPendingOrders(hours) {
        const [rows] = await pool.query(
            'SELECT * FROM Orders WHERE status = "pending" AND created_at <= DATE_SUB(NOW(), INTERVAL ? HOUR)',
            [hours]
        );
        return rows;
    },

    async updateOrderStatus(order_id, status) {
        const [result] = await pool.query(
            'UPDATE Orders SET status = ? WHERE id = ?',
            [status, order_id]
        );
        return result.affectedRows;
    }
};

module.exports = OrderModel;

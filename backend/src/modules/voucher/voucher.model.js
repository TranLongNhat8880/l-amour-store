const pool = require('../../config/database');
const generateId = require('../../utils/generateId');

const VoucherModel = {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM Vouchers ORDER BY created_at DESC');
        return rows;
    },

    async findByCode(code) {
        const [rows] = await pool.query('SELECT * FROM Vouchers WHERE code = ?', [code]);
        return rows[0];
    },

    async create(data) {
        const { code, discount_type, discount_value, usage_limit, expiry_date } = data;
        const id = generateId();
        await pool.query(
            'INSERT INTO Vouchers (id, code, discount_type, discount_value, usage_limit, expiry_date) VALUES (?, ?, ?, ?, ?, ?)',
            [id, code, discount_type || 'percent', discount_value, usage_limit, expiry_date]
        );
        return id;
    },

    async delete(id) {
        const [result] = await pool.query('DELETE FROM Vouchers WHERE id = ?', [id]);
        return result.affectedRows;
    },

    async decrementUsage(id, connection = pool) {
        await connection.query('UPDATE Vouchers SET usage_limit = usage_limit - 1 WHERE id = ?', [id]);
    },

    async findMyVouchers(userId) {
        const [rows] = await pool.query(`
            SELECT v.*, uv.is_used, uv.assigned_at
            FROM Vouchers v
            JOIN User_Vouchers uv ON v.id = uv.voucher_id
            WHERE uv.user_id = ? AND uv.is_used = FALSE AND v.expiry_date >= NOW()
        `, [userId]);
        return rows;
    }
};

module.exports = VoucherModel;

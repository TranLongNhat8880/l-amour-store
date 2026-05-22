const pool = require('../../config/database');
const generateId = require('../../utils/generateId');

const AddressModel = {
    async findAllByUserId(user_id) {
        const [rows] = await pool.query(
            'SELECT * FROM User_Addresses WHERE user_id = ? ORDER BY is_default DESC, created_at ASC',
            [user_id]
        );
        return rows;
    },

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM User_Addresses WHERE id = ?', [id]);
        return rows[0];
    },

    async create(data) {
        const { user_id, full_name, phone, address_line, city, is_default } = data;
        const id = generateId();

        // Nếu đây là địa chỉ mặc định, bỏ mặc định của tất cả địa chỉ khác trước
        if (is_default) {
            await pool.query(
                'UPDATE User_Addresses SET is_default = FALSE WHERE user_id = ?',
                [user_id]
            );
        }

        await pool.query(
            'INSERT INTO User_Addresses (id, user_id, full_name, phone, address_line, city, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, user_id, full_name, phone, address_line, city, is_default || false]
        );
        return id;
    },

    async update(id, data) {
        const { full_name, phone, address_line, city, is_default, user_id } = data;

        if (is_default) {
            await pool.query(
                'UPDATE User_Addresses SET is_default = FALSE WHERE user_id = ?',
                [user_id]
            );
        }

        const [result] = await pool.query(
            'UPDATE User_Addresses SET full_name = ?, phone = ?, address_line = ?, city = ?, is_default = ? WHERE id = ? AND user_id = ?',
            [full_name, phone, address_line, city, is_default || false, id, user_id]
        );
        return result.affectedRows;
    },

    async delete(id, user_id) {
        const [result] = await pool.query(
            'DELETE FROM User_Addresses WHERE id = ? AND user_id = ?',
            [id, user_id]
        );
        return result.affectedRows;
    },

    async setDefault(id, user_id) {
        // Bỏ mặc định tất cả, rồi đặt cái này làm mặc định
        await pool.query('UPDATE User_Addresses SET is_default = FALSE WHERE user_id = ?', [user_id]);
        const [result] = await pool.query(
            'UPDATE User_Addresses SET is_default = TRUE WHERE id = ? AND user_id = ?',
            [id, user_id]
        );
        return result.affectedRows;
    }
};

module.exports = AddressModel;

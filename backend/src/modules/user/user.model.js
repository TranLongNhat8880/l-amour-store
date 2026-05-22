const pool = require('../../config/database');
const generateId = require('../../utils/generateId');

const UserModel = {
    async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        return rows[0];
    },

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM Users WHERE id = ?', [id]);
        return rows[0];
    },

    async create(userData) {
        const { email, password, full_name, phone, address, role, is_active } = userData;
        const id = generateId();
        await pool.query(
            'INSERT INTO Users (id, email, password, full_name, phone, address, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, email, password, full_name, phone || null, address || null, role || 'user', is_active !== undefined ? is_active : 1]
        );
        return id;
    },

    async updateProfile(id, data) {
        const { full_name, phone, address, avatar_url } = data;
        const [result] = await pool.query(
            'UPDATE Users SET full_name = ?, phone = ?, address = ?, avatar_url = ? WHERE id = ?',
            [full_name, phone || null, address || null, avatar_url || null, id]
        );
        return result.affectedRows;
    },

    async updatePassword(id, hashedPassword) {
        const [result] = await pool.query(
            'UPDATE Users SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );
        return result.affectedRows;
    },

    // OTP Methods
    async saveOtp(email, otpCode, expiresAt) {
        const [result] = await pool.query(
            'UPDATE Users SET otp_code = ?, otp_expires_at = ? WHERE email = ?',
            [otpCode, expiresAt, email]
        );
        return result.affectedRows;
    },

    async findByEmailWithOtp(email) {
        const [rows] = await pool.query(
            'SELECT * FROM Users WHERE email = ?',
            [email]
        );
        return rows[0];
    },

    async clearOtp(id) {
        await pool.query(
            'UPDATE Users SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
            [id]
        );
    },

    async findAdmins() {
        const [rows] = await pool.query('SELECT id FROM Users WHERE role = "admin"');
        return rows;
    }
};

module.exports = UserModel;

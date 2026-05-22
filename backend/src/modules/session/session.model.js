const pool = require('../../config/database');

const SessionModel = {
    async findActiveSessions(userId) {
        const [rows] = await pool.query(
            `SELECT id, user_agent, ip_address, is_revoked, expires_at, created_at
             FROM User_Sessions
             WHERE user_id = ? AND expires_at > NOW() AND is_revoked = FALSE
             ORDER BY created_at DESC`,
            [userId]
        );
        return rows;
    },

    async findSessionById(sessionId, userId) {
        const [rows] = await pool.query(
            'SELECT device_token FROM User_Sessions WHERE id = ? AND user_id = ?',
            [sessionId, userId]
        );
        return rows[0] || null;
    },

    async revokeSession(sessionId, userId) {
        const [result] = await pool.query(
            'UPDATE User_Sessions SET is_revoked = TRUE WHERE id = ? AND user_id = ?',
            [sessionId, userId]
        );
        return result.affectedRows;
    },

    async revokeAllExcept(userId, currentSessionId) {
        await pool.query(
            'UPDATE User_Sessions SET is_revoked = TRUE WHERE user_id = ? AND id != ?',
            [userId, currentSessionId]
        );
    },

    async untrustDevice(userId, deviceToken) {
        await pool.query(
            'UPDATE User_Devices SET is_trusted = FALSE WHERE user_id = ? AND device_token = ?',
            [userId, deviceToken]
        );
    },

    async untrustAllDevicesExcept(userId, currentSessionId) {
        await pool.query(
            `UPDATE User_Devices
             SET is_trusted = FALSE
             WHERE user_id = ? AND device_token IN (
                SELECT device_token FROM User_Sessions WHERE user_id = ? AND id != ? AND device_token IS NOT NULL
             )`,
            [userId, userId, currentSessionId]
        );
    }
};

module.exports = SessionModel;

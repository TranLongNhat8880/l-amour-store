const pool = require('../../config/database');
const generateId = require('../../utils/generateId');
const { notifyUser, notifyAdmins, notifyAll } = require('../../config/socket');

const NotificationModel = {
    // Admin tạo thông báo
    async create(data) {
        const { title, content, type, is_global, created_by, user_id } = data;
        const id = generateId();
        
        await pool.query(
            'INSERT INTO Notifications (id, title, content, type, is_global, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [id, title, content, type || 'general', is_global !== false, created_by || null]
        );

        // Nếu là thông báo cá nhân, tạo liên kết cho từng user trong danh sách
        if (!is_global && user_id) {
            const userIds = Array.isArray(user_id) ? user_id : [user_id];
            for (const uid of userIds) {
                const unId = generateId();
                await pool.query(
                    'INSERT INTO User_Notifications (id, notification_id, user_id, is_read) VALUES (?, ?, ?, FALSE)',
                    [unId, id, uid]
                );
                // Emit real-time notification to this user
                notifyUser(uid, { id, title, content, type, is_read: false, created_at: new Date().toISOString() });
            }
        } else if (is_global) {
            // Emit to all connected users
            notifyAll({ id, title, content, type, is_read: false, created_at: new Date().toISOString() });
        }
        
        return id;
    },

    async countAll() {
        const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM Notifications WHERE created_by IS NOT NULL');
        return count;
    },

    async findAll(limit = 10, offset = 0) {
        const [rows] = await pool.query(`
            SELECT n.*, u.full_name AS created_by_name
            FROM Notifications n
            LEFT JOIN Users u ON n.created_by = u.id
            WHERE n.created_by IS NOT NULL
            ORDER BY n.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        return rows;
    },

    // Lấy danh sách thông báo của 1 user (global + cá nhân), kèm trạng thái đã đọc
    async findForUser(user_id) {
        const [rows] = await pool.query(`
            SELECT 
                n.id, n.title, n.content, n.type, n.created_at,
                COALESCE(un.is_read, FALSE) AS is_read,
                un.read_at
            FROM Notifications n
            LEFT JOIN User_Notifications un ON n.id = un.notification_id AND un.user_id = ?
            WHERE n.is_global = TRUE
               OR un.user_id = ?
            ORDER BY n.created_at DESC
        `, [user_id, user_id]);
        return rows;
    },

    // Đếm số thông báo chưa đọc
    async countUnread(user_id) {
        const [rows] = await pool.query(`
            SELECT COUNT(*) AS unread_count
            FROM Notifications n
            LEFT JOIN User_Notifications un ON n.id = un.notification_id AND un.user_id = ?
            WHERE (n.is_global = TRUE OR un.user_id = ?)
              AND COALESCE(un.is_read, FALSE) = FALSE
        `, [user_id, user_id]);
        return rows[0].unread_count;
    },

    // Đánh dấu đã đọc
    async markAsRead(notification_id, user_id) {
        const id = generateId();
        await pool.query(`
            INSERT INTO User_Notifications (id, notification_id, user_id, is_read, read_at)
            VALUES (?, ?, ?, TRUE, NOW())
            ON DUPLICATE KEY UPDATE is_read = TRUE, read_at = NOW()
        `, [id, notification_id, user_id]);
    },

    // Đánh dấu đọc tất cả
    async markAllAsRead(user_id) {
        // Lấy tất cả notification global chưa có record trong User_Notifications
        const [globals] = await pool.query(`
            SELECT n.id FROM Notifications n
            LEFT JOIN User_Notifications un ON n.id = un.notification_id AND un.user_id = ?
            WHERE n.is_global = TRUE AND un.id IS NULL
        `, [user_id]);

        for (const notif of globals) {
            const id = generateId();
            await pool.query(
                'INSERT IGNORE INTO User_Notifications (id, notification_id, user_id, is_read, read_at) VALUES (?, ?, ?, TRUE, NOW())',
                [id, notif.id, user_id]
            );
        }

        // Cập nhật các cái đã có record
        await pool.query(
            'UPDATE User_Notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ?',
            [user_id]
        );
    }
};

module.exports = NotificationModel;

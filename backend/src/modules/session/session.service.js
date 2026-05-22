const SessionModel = require('./session.model');
const { getIO } = require('../../config/socket');

const parseUserAgent = (ua) => {
    if (!ua) return 'Thiết bị không xác định';
    let browser = 'Trình duyệt lạ';
    if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome/')) browser = 'Google Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox/')) browser = 'Firefox';

    let os = 'Thiết bị lạ';
    if (ua.includes('Windows NT')) os = 'Windows';
    else if (ua.includes('Macintosh')) os = 'MacBook/iMac';
    else if (ua.includes('iPhone')) os = 'iPhone';
    else if (ua.includes('Android')) os = 'Android';

    return `${browser} trên ${os}`;
};

const SessionService = {
    async getMySessions(userId, currentSessionId) {
        const rows = await SessionModel.findActiveSessions(userId);
        return rows.map(s => ({
            ...s,
            device_name: parseUserAgent(s.user_agent),
            is_current: s.id === currentSessionId
        }));
    },

    async revokeSession(sessionId, userId) {
        const session = await SessionModel.findSessionById(sessionId, userId);
        const affected = await SessionModel.revokeSession(sessionId, userId);

        if (affected === 0) {
            const err = new Error('Không tìm thấy phiên đăng nhập hoặc không có quyền');
            err.statusCode = 404;
            throw err;
        }

        // Hủy tin tưởng thiết bị gắn với phiên này
        if (session?.device_token) {
            await SessionModel.untrustDevice(userId, session.device_token);
        }

        // Realtime logout
        getIO().to(userId).emit('force_logout', { sessionId });
    },

    async revokeOtherSessions(userId, currentSessionId) {
        await SessionModel.untrustAllDevicesExcept(userId, currentSessionId);
        await SessionModel.revokeAllExcept(userId, currentSessionId);

        // Realtime logout tất cả thiết bị khác
        getIO().to(userId).emit('force_logout', { sessionId: 'others', except: currentSessionId });
    }
};

module.exports = SessionService;

const SessionService = require('./session.service');
const { success, error } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const SessionController = {
    getMySessions: asyncHandler(async (req, res) => {
        const sessions = await SessionService.getMySessions(req.user.id, req.user.sessionId);
        return success(res, 'Danh sách phiên đăng nhập', sessions);
    }),

    revokeSession: asyncHandler(async (req, res) => {
        await SessionService.revokeSession(req.params.sessionId, req.user.id);
        return success(res, 'Đã đăng xuất thiết bị thành công');
    }),

    revokeOtherSessions: asyncHandler(async (req, res) => {
        await SessionService.revokeOtherSessions(req.user.id, req.user.sessionId);
        return success(res, 'Đã đăng xuất tất cả các thiết bị khác thành công');
    })
};

module.exports = SessionController;

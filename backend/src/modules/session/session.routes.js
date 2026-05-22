const express = require('express');
const SessionController = require('./session.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Tất cả các route này đều yêu cầu đăng nhập
router.use(authMiddleware);

router.get('/', SessionController.getMySessions);
router.delete('/others', SessionController.revokeOtherSessions);
router.delete('/:sessionId', SessionController.revokeSession);

module.exports = router;

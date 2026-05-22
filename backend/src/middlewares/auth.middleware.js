const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');
const pool = require('../config/database');
require('dotenv').config();

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return error(res, 'No token, authorization denied', 401);
    }

    try {
        // Bearer token validation
        const tokenSplit = token.split(' ');
        const actualToken = tokenSplit.length > 1 ? tokenSplit[1] : token;

        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
        
        // --- SESSION VERIFICATION ---
        const sessionId = decoded.user.sessionId;
        if (sessionId) {
            const [sessions] = await pool.query(
                'SELECT id FROM User_Sessions WHERE id = ? AND is_revoked = FALSE AND expires_at > NOW()',
                [sessionId]
            );

            if (sessions.length === 0) {
                return error(res, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn', 401);
            }
        }

        req.user = decoded.user;
        next();
    } catch (err) {
        return error(res, 'Token is not valid', 401);
    }
};

const softAuthMiddleware = async (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        req.user = null; // Khách vãng lai
        return next();
    }

    try {
        const tokenSplit = token.split(' ');
        const actualToken = tokenSplit.length > 1 ? tokenSplit[1] : token;
        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
        
        // Vẫn check session nếu có token
        const sessionId = decoded.user.sessionId;
        if (sessionId) {
            const [sessions] = await pool.query(
                'SELECT id FROM User_Sessions WHERE id = ? AND is_revoked = FALSE AND expires_at > NOW()',
                [sessionId]
            );
            if (sessions.length > 0) {
                req.user = decoded.user;
            } else {
                req.user = null;
            }
        } else {
            req.user = decoded.user;
        }
        next();
    } catch (err) {
        req.user = null; // Token lỗi cũng coi như khách
        next();
    }
};

module.exports = { authMiddleware, softAuthMiddleware };

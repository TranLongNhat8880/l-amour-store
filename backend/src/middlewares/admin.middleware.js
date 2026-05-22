const { error } = require('../utils/response');

const adminMiddleware = (req, res, next) => {
    // req.user is populated by authMiddleware
    if (!req.user || req.user.role !== 'admin') {
        return error(res, 'Access denied. Admin privileges required.', 403);
    }
    next();
};

module.exports = adminMiddleware;

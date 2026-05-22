const { error } = require('../utils/response');

const roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return error(res, 'Access denied. You do not have permission to perform this action.', 403);
        }
        next();
    };
};

module.exports = roleMiddleware;

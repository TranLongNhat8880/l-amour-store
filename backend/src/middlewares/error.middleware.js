const { error } = require('../utils/response');

/**
 * Global Error Handler Middleware
 * Xử lý mọi loại lỗi trong hệ thống và trả về format thống nhất.
 */
const errorMiddleware = (err, req, res, next) => {
    console.error('Error Debug:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        details: err.details // Cho lỗi Joi
    });

    // Xử lý lỗi Joi (Validation)
    if (err.isJoi) {
        const details = err.details.map(i => i.message).join(', ');
        return error(res, `Dữ liệu không hợp lệ: ${details}`, 400);
    }

    // Xử lý các lỗi khác
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Lỗi hệ thống không xác định';

    return error(res, message, statusCode);
};

module.exports = errorMiddleware;

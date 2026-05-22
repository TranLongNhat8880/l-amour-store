/**
 * Validation Middleware
 * Kiểm tra dữ liệu đầu vào (req.body, req.query, hoặc req.params) dựa trên Schema Joi.
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], {
            abortEarly: false, // Trả về tất cả các lỗi thay vì chỉ lỗi đầu tiên
            allowUnknown: true, // Cho phép các trường không định nghĩa trong schema
            stripUnknown: true  // Loại bỏ các trường không định nghĩa khỏi req.body
        });

        if (error) {
            error.isJoi = true; // Đánh dấu đây là lỗi của Joi để middleware xử lý lỗi nhận diện
            return next(error);
        }

        // Cập nhật lại req[property] với dữ liệu đã được làm sạch (stripUnknown)
        req[property] = schema.validate(req[property]).value;
        next();
    };
};

module.exports = validate;

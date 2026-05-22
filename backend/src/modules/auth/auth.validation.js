const Joi = require('joi');

/**
 * Authentication Validation Schemas
 * Định nghĩa quy tắc cho Đăng ký, Đăng nhập và Quên mật khẩu.
 */
const authValidation = {
    // Đăng ký tài khoản mới
    register: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Email không đúng định dạng',
            'any.required': 'Email là bắt buộc'
        }),
        password: Joi.string().min(6).required().messages({
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
            'any.required': 'Mật khẩu là bắt buộc'
        }),
        full_name: Joi.string().required().max(100),
        phone: Joi.string().allow('', null).pattern(/^[0-9]+$/).min(10).max(11),
        address: Joi.string().allow('', null).max(500)
    }),

    // Đăng nhập
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    // Xác nhận OTP đăng ký
    verifyOTP: Joi.object({
        email: Joi.string().email().required(),
        otp_code: Joi.string().length(6).required()
    }),

    // Quên mật khẩu (Gửi OTP)
    forgotPassword: Joi.object({
        email: Joi.string().email().required()
    }),

    // Đặt lại mật khẩu (Xác nhận OTP + Pass mới)
    resetPassword: Joi.object({
        email: Joi.string().email().required(),
        otp_code: Joi.string().length(6).required(),
        new_password: Joi.string().min(6).required()
    })
};

module.exports = authValidation;

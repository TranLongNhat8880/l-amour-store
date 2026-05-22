const Joi = require('joi');

/**
 * Product Validation Schemas
 * Định nghĩa các quy tắc nghiêm ngặt cho dữ liệu Sản phẩm.
 */
const productValidation = {
    // Schema khi tạo sản phẩm mới
    create: Joi.object({
        name: Joi.string().required().min(3).max(255).messages({
            'string.empty': 'Tên sản phẩm không được để trống',
            'string.min': 'Tên sản phẩm phải có ít nhất 3 ký tự',
            'any.required': 'Tên sản phẩm là bắt buộc'
        }),
        category_id: Joi.string().allow(null, ''),
        description: Joi.string().allow(null, '').max(5000),
        price: Joi.number().min(0).required().messages({
            'number.min': 'Giá sản phẩm không được là số âm',
            'any.required': 'Giá sản phẩm là bắt buộc'
        }),
        stock: Joi.number().integer().min(0).default(0).messages({
            'number.min': 'Số lượng tồn kho không được là số âm'
        })
    }),

    // Schema khi cập nhật sản phẩm
    update: Joi.object({
        name: Joi.string().min(3).max(255),
        category_id: Joi.string().allow(null, ''),
        description: Joi.string().allow(null, '').max(5000),
        price: Joi.number().min(0),
        stock: Joi.number().integer().min(0)
    }),

    // Schema cho biến thể (Size, Màu, Giá, Kho)
    variant: Joi.object({
        size: Joi.string().allow(null, '').max(50),
        color: Joi.string().allow(null, '').max(50),
        price: Joi.number().min(0).required().messages({
            'number.min': 'Giá biến thể không được là số âm',
            'any.required': 'Giá biến thể là bắt buộc'
        }),
        stock: Joi.number().integer().min(0).default(0)
    })
};

module.exports = productValidation;

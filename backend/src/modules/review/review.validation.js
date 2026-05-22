const Joi = require('joi');

const reviewValidation = {
    create: Joi.object({
        product_id: Joi.number().integer().required(),
        rating: Joi.number().integer().min(1).max(5).required().messages({
            'number.min': 'Rating tối thiểu là 1 sao',
            'number.max': 'Rating tối đa là 5 sao',
            'any.required': 'Rating là bắt buộc'
        }),
        comment: Joi.string().allow('', null).max(1000).messages({
            'string.max': 'Bình luận không được quá 1000 ký tự'
        })
    })
};

module.exports = reviewValidation;

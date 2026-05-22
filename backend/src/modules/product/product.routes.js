const express = require('express');
const ProductController = require('./product.controller');
const { authMiddleware, softAuthMiddleware } = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const productSchemas = require('./product.validation');
const upload = require('../../middlewares/upload.middleware');

const router = express.Router();

// Public routes (softAuth để kiểm tra tuổi nếu đã login, nhưng vẫn cho khách xem)
router.get('/', softAuthMiddleware, ProductController.getAllProducts);
router.get('/:id', softAuthMiddleware, ProductController.getProductDetails);

// Admin only routes
router.post('/', 
    authMiddleware, 
    roleMiddleware(['admin']), 
    upload.single('thumbnail'),
    validate(productSchemas.create), 
    ProductController.createProduct
);

router.put('/:id', 
    authMiddleware, 
    roleMiddleware(['admin']), 
    upload.single('thumbnail'),
    validate(productSchemas.update), 
    ProductController.updateProduct
);

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), ProductController.deleteProduct);

// Variant management (Admin only)
router.post('/:id/variants', 
    authMiddleware, 
    roleMiddleware(['admin']), 
    upload.single('image'),
    validate(productSchemas.variant),
    ProductController.addVariant
);

router.put('/:id/variants/:variantId', 
    authMiddleware, 
    roleMiddleware(['admin']), 
    upload.single('image'),
    validate(productSchemas.variant),
    ProductController.updateVariant
);

router.delete('/:id/variants/:variantId', 
    authMiddleware, 
    roleMiddleware(['admin']), 
    ProductController.deleteVariant
);

module.exports = router;

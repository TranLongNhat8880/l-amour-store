const ProductService = require('./product.service');
const { success } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
require('dotenv').config();

const getFileUrl = (req, file) => {
    if (!file) return null;
    return file.path;
};

const ProductController = {
    // --- Products ---
    getAllProducts: asyncHandler(async (req, res) => {
        const filters = {
            category_id: req.query.category_id,
            size: req.query.size,
            color: req.query.color,
            min_price: req.query.min_price,
            max_price: req.query.max_price,
            search: req.query.search,
            show18Plus: !!req.user // Nếu req.user tồn tại thì là đã đăng nhập
        };
        const products = await ProductService.getAllProducts(filters);
        return success(res, 'Products retrieved successfully', products);
    }),

    getProductDetails: asyncHandler(async (req, res) => {
        const product = await ProductService.getProductDetails(req.params.id);
        if (!product) {
            const err = new Error('Không tìm thấy sản phẩm');
            err.statusCode = 404;
            throw err;
        }

        // Chặn khách vãng lai xem chi tiết đồ 18+
        if (product.is_age_restricted && !req.user) {
            const err = new Error('Bạn cần đăng nhập để xem sản phẩm này');
            err.statusCode = 403;
            throw err;
        }
        return success(res, 'Product details retrieved', product);
    }),

    createProduct: asyncHandler(async (req, res) => {
        const { category_id, name, description, price, stock } = req.body;
        let thumbnail_url = getFileUrl(req, req.file);

        const productId = await ProductService.createProduct({
            category_id, name, description, thumbnail_url
        });

        // Nếu có giá được gửi lên, tự động tạo 1 biến thể mặc định (One Size/Default)
        if (price !== undefined && price !== null) {
            await ProductService.addVariantToProduct(productId, {
                size: 'M', // Mặc định
                color: 'Đen', // Mặc định
                price: parseFloat(price),
                stock: parseInt(stock) || 0,
                image_url: thumbnail_url
            });
        }

        return success(res, 'Product created successfully', { id: productId }, 201);
    }),

    updateProduct: asyncHandler(async (req, res) => {
        const { category_id, name, description, price, stock } = req.body;
        let thumbnail_url = getFileUrl(req, req.file);

        // Fetch current product to keep old image if no new image is uploaded
        const current = await ProductService.getProductDetails(req.params.id);
        if (!current) {
            const err = new Error('Không tìm thấy sản phẩm');
            err.statusCode = 404;
            throw err;
        }

        if (!thumbnail_url) {
            thumbnail_url = current.thumbnail_url;
        }

        await ProductService.updateProduct(req.params.id, {
            category_id, name, description, thumbnail_url
        });

        // Cập nhật giá và tồn kho cho biến thể đầu tiên (nếu có)
        if (price !== undefined && current.variants && current.variants.length > 0) {
            const firstVariant = current.variants[0];
            await ProductService.updateVariant(firstVariant.id, {
                size: firstVariant.size,
                color: firstVariant.color,
                price: parseFloat(price),
                stock: parseInt(stock) || 0,
                image_url: firstVariant.image_url
            });
        }

        return success(res, 'Product updated successfully');
    }),

    deleteProduct: asyncHandler(async (req, res) => {
        await ProductService.deleteProduct(req.params.id);
        return success(res, 'Product deleted successfully');
    }),

    // --- Variants ---
    addVariant: asyncHandler(async (req, res) => {
        const { size, color, price, stock } = req.body;
        let image_url = getFileUrl(req, req.file);

        const variantId = await ProductService.addVariantToProduct(req.params.id, {
            size, color, price, stock, image_url
        });

        return success(res, 'Variant added successfully', { id: variantId }, 201);
    }),

    updateVariant: asyncHandler(async (req, res) => {
        const { size, color, price, stock } = req.body;
        let image_url = getFileUrl(req, req.file);

        await ProductService.updateVariant(req.params.variantId, {
            size, color, price, stock, image_url
        });

        return success(res, 'Variant updated successfully');
    }),

    deleteVariant: asyncHandler(async (req, res) => {
        await ProductService.deleteVariant(req.params.variantId);
        return success(res, 'Variant deleted successfully');
    })
};

module.exports = ProductController;

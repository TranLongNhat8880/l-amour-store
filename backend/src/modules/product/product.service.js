const ProductModel = require('./product.model');

const ProductService = {
    async getAllProducts(filters) {
        // Multi-dimensional Variant Filtering handled in Model's dynamic query builder
        const products = await ProductModel.findAll(filters);
        return products;
    },

    async getProductDetails(id) {
        const product = await ProductModel.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }

        const variants = await ProductModel.findVariantsByProductId(id);
        product.variants = variants;
        
        return product;
    },

    async createProduct(productData) {
        return await ProductModel.createProduct(productData);
    },

    async updateProduct(id, productData) {
        const product = await ProductModel.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }
        await ProductModel.updateProduct(id, productData);
        return true;
    },

    async deleteProduct(id) {
        const product = await ProductModel.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }
        await ProductModel.deleteProduct(id);
        return true;
    },

    // --- Variant logic ---
    async addVariantToProduct(productId, variantData) {
        const product = await ProductModel.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }
        return await ProductModel.createVariant({ ...variantData, product_id: productId });
    },

    async updateVariant(variantId, variantData) {
        const current = await ProductModel.findVariantById(variantId);
        if (!current) {
            throw new Error('Variant not found');
        }

        const hasValue = (value) => value !== undefined && value !== null && value !== '';
        const nextData = {
            size: hasValue(variantData.size) ? variantData.size : current.size,
            color: hasValue(variantData.color) ? variantData.color : current.color,
            image_url: hasValue(variantData.image_url) ? variantData.image_url : current.image_url,
            price: hasValue(variantData.price) ? Number(variantData.price) : current.price,
            stock: hasValue(variantData.stock) ? Number(variantData.stock) : current.stock
        };

        await ProductModel.updateVariant(variantId, nextData);
        return true;
    },

    async deleteVariant(variantId) {
        await ProductModel.deleteVariant(variantId);
        return true;
    }
};

module.exports = ProductService;

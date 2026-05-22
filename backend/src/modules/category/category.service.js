const CategoryModel = require('./category.model');
const ProductModel = require('../product/product.model');

const CategoryService = {
    async getAllCategories() {
        const categories = await CategoryModel.findAll();
        
        // Build category tree
        const categoryMap = {};
        const roots = [];

        // Initialize map
        categories.forEach(category => {
            categoryMap[category.id] = { ...category, children: [] };
        });

        // Build tree structure
        categories.forEach(category => {
            if (category.parent_id === null) {
                roots.push(categoryMap[category.id]);
            } else {
                if (categoryMap[category.parent_id]) {
                    categoryMap[category.parent_id].children.push(categoryMap[category.id]);
                }
            }
        });

        return roots;
    },

    async getCategoryById(id) {
        const category = await CategoryModel.findById(id);
        if (!category) {
            throw new Error('Category not found');
        }
        return category;
    },

    async createCategory(categoryData) {
        return await CategoryModel.create(categoryData);
    },

    async updateCategory(id, categoryData) {
        const category = await CategoryModel.findById(id);
        if (!category) {
            throw new Error('Category not found');
        }
        
        // Prevent self-referencing parent
        if (categoryData.parent_id == id) {
            throw new Error('Category cannot be its own parent');
        }

        await CategoryModel.update(id, categoryData);
        return true;
    },

    async deleteCategory(id) {
        const category = await CategoryModel.findById(id);
        if (!category) {
            throw new Error('Category not found');
        }

        // Kiểm tra xem danh mục có đang chứa sản phẩm không
        const productCount = await ProductModel.countByCategoryId(id);
        if (productCount > 0) {
            throw new Error(`Không thể xóa vì danh mục đang chứa ${productCount} sản phẩm`);
        }
        
        // When deleted, the model's ON DELETE SET NULL for parent_id handles children
        await CategoryModel.delete(id);
        return true;
    }
};

module.exports = CategoryService;

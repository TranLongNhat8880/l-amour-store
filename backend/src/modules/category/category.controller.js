const CategoryService = require('./category.service');
const { success, error } = require('../../utils/response');

const CategoryController = {
    async getAllCategories(req, res) {
        try {
            const categories = await CategoryService.getAllCategories();
            return success(res, 'Categories retrieved', categories);
        } catch (err) {
            return error(res, 'Server Error', 500);
        }
    },

    async getCategoryById(req, res) {
        try {
            const category = await CategoryService.getCategoryById(req.params.id);
            return success(res, 'Category retrieved', category);
        } catch (err) {
            return error(res, err.message, 404);
        }
    },

    async createCategory(req, res) {
        try {
            const { name, parent_id, is_age_restricted } = req.body;
            
            if (!name) {
                return error(res, 'Category name is required', 400);
            }

            const newCategoryId = await CategoryService.createCategory({
                name, parent_id, is_age_restricted
            });

            return success(res, 'Category created successfully', { id: newCategoryId }, 201);
        } catch (err) {
            return error(res, 'Server Error', 500);
        }
    },

    async updateCategory(req, res) {
        try {
            const { name, parent_id, is_age_restricted } = req.body;
            
            if (!name) {
                return error(res, 'Category name is required', 400);
            }

            await CategoryService.updateCategory(req.params.id, {
                name, parent_id, is_age_restricted
            });

            return success(res, 'Category updated successfully');
        } catch (err) {
            return error(res, err.message, err.message === 'Category not found' ? 404 : 400);
        }
    },

    async deleteCategory(req, res) {
        try {
            await CategoryService.deleteCategory(req.params.id);
            return success(res, 'Category deleted successfully');
        } catch (err) {
            return error(res, err.message, 404);
        }
    }
};

module.exports = CategoryController;

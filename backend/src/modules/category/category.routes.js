const express = require('express');
const CategoryController = require('./category.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

const router = express.Router();

// Public routes
router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getCategoryById);

// Admin only routes
router.post('/', authMiddleware, roleMiddleware(['admin']), CategoryController.createCategory);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), CategoryController.updateCategory);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), CategoryController.deleteCategory);

module.exports = router;

const pool = require('../../config/database');
const generateId = require('../../utils/generateId');

const ProductModel = {
    async findAll(filters = {}) {
        let query = `
            SELECT p.*, c.name as category_name,
                   (SELECT SUM(stock) FROM Product_Variants WHERE product_id = p.id) as total_stock,
                   (SELECT COUNT(*) FROM Product_Variants WHERE product_id = p.id) as variants_count,
                   (SELECT MIN(price) FROM Product_Variants WHERE product_id = p.id) as min_price,
                   (SELECT COALESCE(AVG(rating), 0) FROM Reviews WHERE product_id = p.id) as rating,
                   (SELECT COUNT(*) FROM Reviews WHERE product_id = p.id) as review_count,
                   (SELECT COALESCE(SUM(od.quantity), 0) FROM Order_Details od JOIN Orders o ON od.order_id = o.id WHERE od.variant_id IN (SELECT id FROM Product_Variants WHERE product_id = p.id) AND o.status = 'completed') as sold_count
            FROM Products p
            LEFT JOIN Categories c ON p.category_id = c.id
            WHERE 1=1
        `;
        const queryParams = [];

        // Lọc 18+ nếu là khách vãng lai (không đăng nhập)
        if (filters.show18Plus === false) {
            query += ' AND COALESCE(c.is_age_restricted, 0) = 0';
        }

        if (filters.category_id) {
            query += ' AND p.category_id = ?';
            queryParams.push(filters.category_id);
        }

        if (filters.search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            queryParams.push(searchTerm, searchTerm);
        }

        const hasVariantFilter = filters.size || filters.color || filters.min_price || filters.max_price;

        if (hasVariantFilter) {
            query += ` AND p.id IN (
                SELECT product_id FROM Product_Variants WHERE 1=1
            `;
            if (filters.size) {
                query += ' AND size = ?';
                queryParams.push(filters.size);
            }
            if (filters.color) {
                query += ' AND color = ?';
                queryParams.push(filters.color);
            }
            if (filters.min_price) {
                query += ' AND price >= ?';
                queryParams.push(filters.min_price);
            }
            if (filters.max_price) {
                query += ' AND price <= ?';
                queryParams.push(filters.max_price);
            }
            query += ')';
        }

        query += ' ORDER BY p.created_at DESC';

        const [rows] = await pool.query(query, queryParams);
        return rows;
    },

    async countByCategoryId(categoryId) {
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM Products WHERE category_id = ?', [categoryId]);
        return rows[0].count;
    },

    async findById(id) {
        const [rows] = await pool.query(`
            SELECT p.*, c.name as category_name, c.is_age_restricted,
                   (SELECT SUM(stock) FROM Product_Variants WHERE product_id = p.id) as total_stock,
                   (SELECT COUNT(*) FROM Product_Variants WHERE product_id = p.id) as variants_count,
                   (SELECT MIN(price) FROM Product_Variants WHERE product_id = p.id) as min_price,
                   (SELECT COALESCE(AVG(rating), 0) FROM Reviews WHERE product_id = p.id) as rating,
                   (SELECT COUNT(*) FROM Reviews WHERE product_id = p.id) as review_count,
                   (SELECT COALESCE(SUM(od.quantity), 0) FROM Order_Details od JOIN Orders o ON od.order_id = o.id WHERE od.variant_id IN (SELECT id FROM Product_Variants WHERE product_id = p.id) AND o.status = 'completed') as sold_count
            FROM Products p
            LEFT JOIN Categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [id]);
        return rows[0];
    },

    async createProduct(productData) {
        const { category_id, name, description, thumbnail_url } = productData;
        const id = generateId();
        await pool.query(
            'INSERT INTO Products (id, category_id, name, description, thumbnail_url) VALUES (?, ?, ?, ?, ?)',
            [id, category_id || null, name, description || null, thumbnail_url || null]
        );
        return id;
    },

    async updateProduct(id, productData) {
        const { category_id, name, description, thumbnail_url } = productData;
        const [result] = await pool.query(
            'UPDATE Products SET category_id = ?, name = ?, description = ?, thumbnail_url = ? WHERE id = ?',
            [category_id || null, name, description || null, thumbnail_url || null, id]
        );
        return result.affectedRows;
    },

    async deleteProduct(id) {
        const [result] = await pool.query('DELETE FROM Products WHERE id = ?', [id]);
        return result.affectedRows;
    },

    // --- Product Variants ---
    async findVariantsByProductId(productId) {
        const [rows] = await pool.query('SELECT * FROM Product_Variants WHERE product_id = ?', [productId]);
        return rows;
    },

    async findVariantById(id) {
        const [rows] = await pool.query('SELECT * FROM Product_Variants WHERE id = ?', [id]);
        return rows[0];
    },

    async createVariant(variantData) {
        const { product_id, size, color, image_url, price, stock } = variantData;
        const id = generateId();
        await pool.query(
            'INSERT INTO Product_Variants (id, product_id, size, color, image_url, price, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, product_id, size || null, color || null, image_url || null, price, stock || 0]
        );
        return id;
    },

    async updateVariant(id, variantData) {
        const { size, color, image_url, price, stock } = variantData;
        const [result] = await pool.query(
            'UPDATE Product_Variants SET size = ?, color = ?, image_url = ?, price = ?, stock = ? WHERE id = ?',
            [size || null, color || null, image_url || null, price, stock || 0, id]
        );
        return result.affectedRows;
    },

    async deleteVariant(id) {
        const [result] = await pool.query('DELETE FROM Product_Variants WHERE id = ?', [id]);
        return result.affectedRows;
    }
};

module.exports = ProductModel;

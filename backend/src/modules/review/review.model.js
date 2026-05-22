const pool = require('../../config/database');
const generateId = require('../../utils/generateId');

const ReviewModel = {
    async findByProductId(product_id) {
        const [rows] = await pool.query(`
            SELECT r.*, u.full_name, u.avatar_url, p.name as product_name, p.thumbnail_url as product_image
            FROM Reviews r
            JOIN Users u ON r.user_id = u.id
            JOIN Products p ON r.product_id = p.id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC
        `, [product_id]);
        return rows;
    },

    async findAll() {
        const [rows] = await pool.query(`
            SELECT r.*, u.full_name, u.email as user_email, u.avatar_url, 
                   p.name as product_name, p.thumbnail_url as product_image
            FROM Reviews r
            JOIN Users u ON r.user_id = u.id
            JOIN Products p ON r.product_id = p.id
            ORDER BY r.created_at DESC
        `);
        return rows;
    },

    async findByUserAndProduct(user_id, product_id) {
        const [rows] = await pool.query(
            'SELECT * FROM Reviews WHERE user_id = ? AND product_id = ?',
            [user_id, product_id]
        );
        return rows[0];
    },

    async hasUserPurchasedProduct(user_id, product_id) {
        const [rows] = await pool.query(`
            SELECT 1 FROM Order_Details od
            JOIN Product_Variants pv ON od.variant_id = pv.id
            JOIN Orders o ON od.order_id = o.id
            WHERE o.user_id = ? AND pv.product_id = ? AND o.status = 'completed'
            LIMIT 1
        `, [user_id, product_id]);
        return rows.length > 0;
    },

    async create(reviewData) {
        const { user_id, product_id, rating, comment } = reviewData;
        const id = generateId();
        await pool.query(
            'INSERT INTO Reviews (id, user_id, product_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [id, user_id, product_id, rating, comment || null]
        );
        return id;
    },

    async delete(id, user_id = null) {
        let query = 'DELETE FROM Reviews WHERE id = ?';
        const params = [id];
        
        if (user_id) {
            query += ' AND user_id = ?';
            params.push(user_id);
        }

        const [result] = await pool.query(query, params);
        return result.affectedRows;
    }
};

module.exports = ReviewModel;

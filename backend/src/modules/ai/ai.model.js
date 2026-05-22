const pool = require('../../config/database');

const AiModel = {
    async getProductsForContext() {
        const [rows] = await pool.query(`
            SELECT p.id, p.name, p.description, c.name as category_name
            FROM Products p
            JOIN Categories c ON p.category_id = c.id
        `);
        return rows;
    }
};

module.exports = AiModel;

const pool = require('../../config/database');
const generateId = require('../../utils/generateId');

const CategoryModel = {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM Categories ORDER BY parent_id ASC, id ASC');
        return rows;
    },

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM Categories WHERE id = ?', [id]);
        return rows[0];
    },

    async create(categoryData) {
        const { name, parent_id, is_age_restricted } = categoryData;
        const id = generateId();
        await pool.query(
            'INSERT INTO Categories (id, name, parent_id, is_age_restricted) VALUES (?, ?, ?, ?)',
            [id, name, parent_id || null, is_age_restricted || false]
        );
        return id;
    },

    async update(id, categoryData) {
        const { name, parent_id, is_age_restricted } = categoryData;
        const [result] = await pool.query(
            'UPDATE Categories SET name = ?, parent_id = ?, is_age_restricted = ? WHERE id = ?',
            [name, parent_id || null, is_age_restricted || false, id]
        );
        return result.affectedRows;
    },

    async delete(id) {
        const [result] = await pool.query('DELETE FROM Categories WHERE id = ?', [id]);
        return result.affectedRows;
    }
};

module.exports = CategoryModel;

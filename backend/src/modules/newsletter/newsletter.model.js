const pool = require('../../config/database');
const generateId = require('../../utils/generateId');

const NewsletterModel = {
    async findByEmail(email) {
        const [rows] = await pool.query('SELECT id FROM Newsletters WHERE email = ?', [email]);
        return rows[0] || null;
    },

    async create(email) {
        const id = generateId();
        await pool.query('INSERT INTO Newsletters (id, email) VALUES (?, ?)', [id, email]);
        return id;
    }
};

module.exports = NewsletterModel;

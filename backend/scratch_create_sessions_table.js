const pool = require('./src/config/database');

async function createSessionsTable() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS User_Sessions (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                user_agent TEXT,
                ip_address VARCHAR(45),
                is_revoked BOOLEAN DEFAULT FALSE,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            );
        `;
        await pool.query(sql);
        console.log('Table User_Sessions created successfully or already exists.');
        process.exit(0);
    } catch (err) {
        console.error('Error creating table:', err.message);
        process.exit(1);
    }
}

createSessionsTable();

const pool = require('./src/config/database');

async function createUserDevicesTable() {
    try {
        console.log('Starting table creation...');
        const sql = `
            CREATE TABLE IF NOT EXISTS User_Devices (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                device_name VARCHAR(255),
                fingerprint VARCHAR(255),
                device_token VARCHAR(255) UNIQUE,
                ip_address VARCHAR(45),
                location VARCHAR(255),
                trusted_at DATETIME,
                is_trusted BOOLEAN DEFAULT FALSE,
                trusted_until DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `;
        await pool.query(sql);
        console.log('Table User_Devices created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error creating table:', err);
        process.exit(1);
    }
}

createUserDevicesTable();

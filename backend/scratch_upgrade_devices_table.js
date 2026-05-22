const pool = require('./src/config/database');

async function upgradeUserDevicesTable() {
    try {
        console.log('Upgrading User_Devices table...');
        
        // Add unique constraint for (user_id, fingerprint)
        // This ensures one device record per user per browser fingerprint
        await pool.query(`
            ALTER TABLE User_Devices 
            ADD CONSTRAINT unique_user_fingerprint UNIQUE (user_id, fingerprint)
        `);
        
        console.log('Unique constraint added successfully.');
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY' || err.code === 'ER_DUP_KEYNAME') {
            console.log('Constraint already exists or table has duplicate data that needs cleaning.');
        } else {
            console.error('Error upgrading table:', err);
        }
        process.exit(1);
    }
}

upgradeUserDevicesTable();

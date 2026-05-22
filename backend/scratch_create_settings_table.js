const db = require('./src/config/database');

async function createSettingsTable() {
  try {
    const [result] = await db.execute(`
      CREATE TABLE IF NOT EXISTS site_settings (
        \`key\` VARCHAR(50) PRIMARY KEY,
        \`value\` JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Table site_settings created or already exists.');

    // Seed initial hero banner
    const heroValue = JSON.stringify({
      imageUrl: '/hero-bg.jpg',
      title: 'Embrace Your Elegance',
      subtitle: 'Bộ Sưu Tập Nửa Đêm',
      description: 'Khám phá những thiết kế nội y tôn vinh vẻ đẹp, mang lại sự tự tin tuyệt đối. Đóng gói bảo mật, giao hàng kín đáo.',
      buttonText: 'Khám Phá Ngay'
    });

    await db.execute(`
      INSERT INTO site_settings (\`key\`, \`value\`)
      VALUES ('hero_banner', ?)
      ON DUPLICATE KEY UPDATE \`value\` = ?
    `, [heroValue, heroValue]);

    console.log('Initial hero banner settings seeded.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }
}

createSettingsTable();

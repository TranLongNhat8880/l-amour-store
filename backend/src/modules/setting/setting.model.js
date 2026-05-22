const db = require('../../config/database');

const SettingModel = {
  get: async (key) => {
    const [rows] = await db.execute('SELECT `value` FROM site_settings WHERE `key` = ?', [key]);
    if (rows.length === 0) return null;
    return typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
  },

  update: async (key, value) => {
    const jsonValue = JSON.stringify(value);
    await db.execute(
      'INSERT INTO site_settings (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?',
      [key, jsonValue, jsonValue]
    );
    return value;
  }
};

module.exports = SettingModel;

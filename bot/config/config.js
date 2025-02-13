const path = require('path');
const dotenv = require('dotenv');

// .env faylni o'qish
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    throw new Error('.env fayli topilmadi: ' + result.error.message);
}

const config = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    SUPPORT_GROUP_ID: process.env.SUPPORT_GROUP_ID,
    DB_CONFIG: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DBNAME
    }
};

if (!config.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN topilmadi!');
}

if (!config.SUPPORT_GROUP_ID) {
    throw new Error('SUPPORT_GROUP_ID topilmadi!');
}

module.exports = config; 
const { createDbConnection } = require('../database/connection');
const logger = require('../utils/logger');

async function isUserRegistered(db, userId) {
    try {
        const [results] = await db.execute('SELECT * FROM telegram_user WHERE user_id = ?', [userId]);
        return results.length > 0;
    } catch (err) {
        logger.error('Bazadan ma\'lumot olishda xatolik:', err);
        return false;
    }
}

async function registerUser(db, userData) {
    const { userId, username, firstName, lastName } = userData;
    try {
        await db.execute(
            'INSERT INTO telegram_user (user_id, username, first_name, last_name, status) VALUES (?, ?, ?, ?, ?)',
            [userId, username, firstName, lastName, 'new']
        );
        logger.info(`Foydalanuvchi saqlandi: ${userId}`);
    } catch (err) {
        logger.error('Foydalanuvchini saqlashda xatolik:', err);
        throw err;
    }
}

module.exports = {
    isUserRegistered,
    registerUser
}; 
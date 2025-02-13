const config = require('../config/config');
const logger = require('../utils/logger');

async function checkSubscription(bot, userId) {
    try {
        const member = await bot.getChatMember(config.CHANNEL_ID, userId);
        const validStatuses = ['member', 'administrator', 'creator'];
        return validStatuses.includes(member.status);
    } catch (error) {
        logger.error('Obuna tekshirishda xatolik:', error);
        return false;
    }
}

module.exports = { checkSubscription }; 
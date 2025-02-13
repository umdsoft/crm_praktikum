const { createDbConnection } = require('../database/connection');
const { checkSubscription } = require('../services/subscriptionService');
const { mainKeyboard } = require('../keyboards/keyboards');
const logger = require('../utils/logger');

async function handleCallback(bot, query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;

    if (query.data === 'check_subscription') {
        try {
            const db = await createDbConnection();
            if (await checkSubscription(bot, userId)) {
                await db.execute(
                    'UPDATE telegram_user SET status = ? WHERE user_id = ?',
                    ['active', userId]
                );
                
                await bot.sendMessage(chatId, "🔽 Quyidagi menyudan kerakli bo'limni tanlang:", {
                    reply_markup: mainKeyboard
                });

                try {
                    await bot.deleteMessage(chatId, messageId);
                } catch (err) {
                    logger.error('Xabarni o\'chirishda xatolik:', err);
                }
            } else {
                await bot.answerCallbackQuery(query.id, {
                    text: "Iltimos, avval kanalga a'zo bo'ling!",
                    show_alert: true
                });
            }
            await db.end();
        } catch (err) {
            logger.error('Callback query da xatolik:', err);
        }
    }
}

module.exports = { handleCallback }; 
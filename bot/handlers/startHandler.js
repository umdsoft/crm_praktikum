const { createDbConnection } = require('../database/connection');
const { isUserRegistered, registerUser } = require('../services/userService');
const { mainKeyboard, subscriptionKeyboard } = require('../keyboards/keyboards');
const config = require('../config/config');
const logger = require('../utils/logger');

async function handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userData = {
        userId,
        username: msg.from.username || null,
        firstName: msg.from.first_name || null,
        lastName: msg.from.last_name || null
    };

    const welcomeMessage = `👋 Assalomu alaykum, ${userData.firstName}!\n\n...`; // To'liq xabar

    try {
        const db = await createDbConnection();

        if (!await isUserRegistered(db, userId)) {
            await bot.sendMessage(chatId, welcomeMessage);
            await registerUser(db, userData);
            
            const sentMessage = await bot.sendMessage(
                chatId, 
                `Iltimos, avval bizning kanalimizga obuna bo'ling: ${config.CHANNEL_ID} 📢`,
                { reply_markup: subscriptionKeyboard }
            );
            
            await db.execute(
                'UPDATE telegram_user SET message_id = ? WHERE user_id = ?',
                [sentMessage.message_id, userId]
            );
        } else {
            await bot.sendMessage(chatId, welcomeMessage);
            await bot.sendMessage(chatId, "🔽 Quyidagi menyudan kerakli bo'limni tanlang:", {
                reply_markup: mainKeyboard
            });
        }
        await db.end();
    } catch (err) {
        logger.error('Start komandasida xatolik:', err);
        bot.sendMessage(chatId, "Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
}

module.exports = { handleStart }; 
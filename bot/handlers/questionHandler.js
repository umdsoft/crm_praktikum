const logger = require('../utils/logger');

class QuestionHandler {
    constructor(bot, supportGroupId) {
        this.bot = bot;
        this.supportGroupId = supportGroupId;
    }

    // Foydalanuvchi savolini qayta ishlash
    async handleUserQuestion(msg) {
        try {
            await this.bot.sendMessage(
                this.supportGroupId,
                `#savol\n\n` +
                `👤 Foydalanuvchi: ${msg.from.first_name}\n` +
                `Username: @${msg.from.username || 'mavjud emas'}\n` +
                `ID: ${msg.from.id}\n\n` +
                `❓ Savol: ${msg.text}`
            );

            await this.bot.sendMessage(
                msg.chat.id,
                "✅ Savolingiz qabul qilindi! Tez orada javob beramiz."
            );
        } catch (error) {
            logger.error('Savolni yuborishda xatolik:', error.message);
            await this.bot.sendMessage(
                msg.chat.id,
                "❌ Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."
            );
        }
    }

    // Guruhdan kelgan javobni qayta ishlash
    async handleGroupReply(msg) {
        if (!msg.reply_to_message) return;

        try {
            const originalText = msg.reply_to_message.text;
            const idMatch = originalText.match(/ID: (\d+)/);
            
            if (idMatch && idMatch[1]) {
                const userId = idMatch[1];
                
                await this.bot.sendMessage(
                    userId,
                    `📝 Javob: ${msg.text}`
                );
                
                await this.bot.sendMessage(
                    this.supportGroupId,
                    '✅ Javob yuborildi!',
                    { reply_to_message_id: msg.message_id }
                );
            }
        } catch (error) {
            logger.error('Javob yuborishda xatolik:', error.message);
        }
    }
}

module.exports = QuestionHandler; 
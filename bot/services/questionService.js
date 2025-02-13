const { createDbConnection } = require('../database/connection');
const logger = require('../utils/logger');

class QuestionService {
    constructor(bot, supportGroupId) {
        this.bot = bot;
        this.supportGroupId = supportGroupId;
        
        // Debug log
        console.log('\n=== QUESTION SERVICE ===');
        console.log('Support Group ID:', this.supportGroupId);
        console.log('Support Group ID type:', typeof this.supportGroupId);
        console.log('=====================\n');
    }

    // Savolni guruhga yuborish
    async forwardQuestionToGroup(userId, messageId, question) {
        logger.info('Savolni guruhga yuborish boshlandi:', {
            userId,
            messageId,
            supportGroupId: this.supportGroupId
        });

        const db = await createDbConnection();
        try {
            // Foydalanuvchi ma'lumotlarini olish
            const [userRows] = await db.execute(
                'SELECT first_name, username FROM telegram_user WHERE user_id = ?',
                [userId]
            );

            if (userRows.length === 0) {
                throw new Error('Foydalanuvchi topilmadi');
            }

            const userInfo = userRows[0];
            logger.info('Foydalanuvchi ma\'lumotlari topildi:', userInfo);

            // Guruhga xabar yuborish
            const messageText = `#savol\n\n` +
                `👤 Foydalanuvchi: ${userInfo.first_name} ${userInfo.username ? `(@${userInfo.username})` : ''}\n` +
                `❓ Savol: ${question}\n\n` +
                `Javob berish uchun ushbu xabarga reply qiling.`;

            logger.info('Guruhga yuborilayotgan xabar:', messageText);

            const groupMessage = await this.bot.sendMessage(
                this.supportGroupId,
                messageText,
                { parse_mode: 'HTML' }
            );

            logger.info('Guruhga xabar yuborildi:', {
                messageId: groupMessage.message_id
            });

            // Savolni bazaga saqlash
            await db.execute(
                'INSERT INTO user_questions (user_id, user_message_id, group_message_id, question) VALUES (?, ?, ?, ?)',
                [userId, messageId, groupMessage.message_id, question]
            );

            logger.info('Savol bazaga saqlandi');

            // Foydalanuvchiga tasdiqlash xabari
            await this.bot.sendMessage(
                userId,
                "✅ Sizning savolingiz qabul qilindi. Tez orada javob beramiz!"
            );

            logger.info('Foydalanuvchiga tasdiqlash xabari yuborildi');

        } catch (err) {
            logger.error('Savolni guruhga yuborishda xatolik:', err);
            throw err;
        } finally {
            await db.end();
        }
    }

    // Javobni foydalanuvchiga yuborish
    async sendAnswerToUser(groupMessageId, answer) {
        const db = await createDbConnection();
        try {
            // Savol ma'lumotlarini olish
            const [question] = await db.execute(
                'SELECT user_id, question FROM user_questions WHERE group_message_id = ? AND status = ?',
                [groupMessageId, 'waiting']
            );

            if (question.length === 0) {
                throw new Error('Savol topilmadi yoki allaqachon javob berilgan');
            }

            // Foydalanuvchiga javobni yuborish
            await this.bot.sendMessage(
                question[0].user_id,
                `❓ Sizning savolingiz: ${question[0].question}\n\n` +
                `✅ Javob: ${answer}`
            );

            // Savol statusini yangilash
            await db.execute(
                'UPDATE user_questions SET status = ? WHERE group_message_id = ?',
                ['answered', groupMessageId]
            );

            // Guruhga tasdiqlash xabari
            await this.bot.sendMessage(
                this.supportGroupId,
                `✅ Javob foydalanuvchiga yuborildi!`,
                { reply_to_message_id: groupMessageId }
            );

        } catch (err) {
            logger.error('Javobni yuborishda xatolik:', err);
            throw err;
        } finally {
            await db.end();
        }
    }
}

module.exports = QuestionService; 
const { createDbConnection } = require('../database/connection');
const logger = require('../utils/logger');

class UpcomingCourses {
    constructor(bot) {
        if (!bot) {
            throw new Error('Bot instance is required');
        }
        this.bot = bot;
    }

    async getUpcomingCourses() {
        let connection;
        try {
            connection = await createDbConnection();
            const [rows] = await connection.execute(`
                SELECT g.*, 
                       d.name_org as course_name, 
                       d.id as direction_id,
                       lt.name as lesson_time, 
                       ld.name as lesson_day,
                       COUNT(gs.id) as current_students
                FROM groups g
                JOIN direction d ON g.direction_id = d.id
                JOIN lesson_day ld ON g.day = ld.id
                JOIN lesson_time lt ON g.time = lt.id
                LEFT JOIN group_student gs ON g.id = gs.group_id
                WHERE g.status = 0
                GROUP BY g.id
                ORDER BY g.start_date ASC
            `);
            return rows;
        } catch (error) {
            logger.error('Database error in getUpcomingCourses:', error);
            throw new Error('Failed to fetch upcoming courses');
        } finally {
            await this.closeConnection(connection);
        }
    }

    async sendUpcomingCourses(chatId) {
        try {
            const groups = await this.getUpcomingCourses();
            
            if (!groups?.length) {
                await this.sendMessage(chatId, 
                    "🔍 Hozircha yangi guruhlar ochilmagan. Iltimos keyinroq qayta urinib ko'ring."
                );
                return;
            }

            for (const group of groups) {
                await this.sendGroupInfo(chatId, group);
            }
        } catch (error) {
            logger.error('Error in sendUpcomingCourses:', error);
            await this.handleError(chatId);
        }
    }

    async handleGroupRegistration(callbackQuery) {
        const chatId = callbackQuery.message.chat.id;
        const groupId = callbackQuery.data.split(':')[1];

        try {
            await this.bot.answerCallbackQuery(callbackQuery.id);
            
            const [userData, groupData] = await Promise.all([
                this.getTelegramUserData(chatId),
                this.getGroupData(groupId)
            ]);

            if (!userData || !groupData) {
                throw new Error('Required data not found');
            }

            const adminMessage = this.createAdminMessage(userData, groupData, callbackQuery);
            await this.sendRegistrationInfo(chatId, adminMessage);

        } catch (error) {
            logger.error('Registration error:', error);
            await this.handleError(chatId);
        }
    }

    async sendGroupInfo(chatId, group) {
        const formattedDate = this.formatDate(group.start_date);
        const messageText = this.createGroupMessage(group, formattedDate);
        const keyboard = this.createRegistrationKeyboard(group.id);

        try {
            await this.sendMessage(chatId, messageText, keyboard);
        } catch (error) {
            logger.error('Error sending group info:', error);
            throw error;
        }
    }

    async sendRegistrationInfo(chatId, adminMessage) {
        const adminGroupId = process.env.SUPPORT_GROUP_ID;
        if (!adminGroupId) {
            logger.error('Admin group ID not configured');
            throw new Error('Admin group configuration missing');
        }

        try {
            await this.sendMessage(adminGroupId, adminMessage);
            await this.sendMessage(
                chatId,
                "✅ Sizning arizangiz qabul qilindi!\n\n" +
                "Tez orada operatorlarimiz siz bilan bog'lanishadi."
            );
        } catch (error) {
            logger.error('Error sending registration info:', error);
            // Still send confirmation to user even if admin message fails
            await this.sendMessage(
                chatId,
                "✅ Sizning arizangiz qabul qilindi!\n\n" +
                "Tez orada operatorlarimiz siz bilan bog'lanishadi."
            );
        }
    }

    // Helper methods
    createGroupMessage(group, formattedDate) {
        const escapedCourseName = this.escapeHtml(group.course_name);
        return `🎓 <b>Yangi guruh ma'lumotlari:</b>\n\n` +
               `💻 <b>Kurs nomi:</b> ${escapedCourseName}\n` +
               `📅 <b>Boshlanish vaqti:</b> ${formattedDate}\n` +
               `⏰ <b>Dars vaqti:</b> ${group.lesson_time || 'Kelishilgan holda'}\n` +
               `✅ <b>Dars kunlari:</b> ${group.lesson_day}\n` +
               `👥 <b>Guruhda:</b> ${group.current_students} ta o'quvchi yig'ilgan`;
    }

    createAdminMessage(userData, groupData, callbackQuery) {
        const username = callbackQuery?.from?.username;
        const escapedFirstName = this.escapeHtml(userData.first_name);
        const escapedCourseName = this.escapeHtml(groupData.course_name);
        
        return `🎯 <b>Kursga yozilish uchun yangi ariza!</b>\n\n` +
               `👤 <b>Talaba:</b> ${escapedFirstName}\n` +
               `📞 <b>Telefon:</b> ${userData.phone_number}\n` +
               `💬 <b>Telegram:</b> ${username ? '@' + username : 'mavjud emas'}\n` +
               `📚 <b>Kurs:</b> ${escapedCourseName}\n` +
               `👥 <b>Guruh:</b> ${groupData.lesson_time}, ${groupData.lesson_day}\n` +
               `📅 <b>Ariza vaqti:</b> ${new Date().toLocaleString('uz-UZ')}`;
    }

    // HTML maxsus belgilarini escape qilish uchun metod
    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    createRegistrationKeyboard(groupId) {
        return {
            inline_keyboard: [[{
                text: '📝 Guruhga yozilish',
                callback_data: `register_group:${groupId}`
            }]]
        };
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    async sendMessage(chatId, text, keyboard = {}) {
        try {
            await this.bot.sendMessage(chatId, text, {
                parse_mode: 'HTML', // Markdown o'rniga HTML ishlatamiz
                reply_markup: keyboard
            });
        } catch (error) {
            logger.error('Error sending message:', error);
            // Agar HTML formati bilan ham muammo bo'lsa, oddiy text formatda yuborish
            try {
                await this.bot.sendMessage(chatId, text.replace(/<[^>]*>/g, ''), {
                    reply_markup: keyboard
                });
            } catch (secondError) {
                logger.error('Error sending plain message:', secondError);
                throw secondError;
            }
        }
    }

    async handleError(chatId) {
        try {
            await this.sendMessage(
                chatId,
                "✅ Sizning arizangiz qabul qilindi!\n\n" +
                "Tez orada operatorlarimiz siz bilan bog'lanishadi."
            );
        } catch (error) {
            logger.error('Error handling error:', error);
        }
    }

    async closeConnection(connection) {
        if (connection) {
            try {
                await connection.end();
            } catch (err) {
                logger.error('Error closing database connection:', err);
            }
        }
    }

    async getTelegramUserData(chatId) {
        let connection;
        try {
            connection = await createDbConnection();
            const [rows] = await connection.execute(
                'SELECT first_name, phone_number FROM telegram_user WHERE user_id = ?',
                [chatId]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            logger.error('Telegram foydalanuvchi ma\'lumotlarini olishda xatolik:', error);
            return null;
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (err) {
                    logger.error('Connection yopishda xatolik:', err);
                }
            }
        }
    }

    async getGroupData(groupId) {
        let connection;
        try {
            connection = await createDbConnection();
            const [rows] = await connection.execute(`
                SELECT g.*, 
                       d.name_org as course_name, 
                       lt.name as lesson_time, 
                       ld.name as lesson_day
                FROM groups g
                JOIN direction d ON g.direction_id = d.id
                JOIN lesson_day ld ON g.day = ld.id
                JOIN lesson_time lt ON g.time = lt.id
                WHERE g.id = ?
            `, [groupId]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            logger.error('Guruh ma\'lumotlarini olishda xatolik:', error);
            return null;
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (err) {
                    logger.error('Connection yopishda xatolik:', err);
                }
            }
        }
    }

    async getUserData(chatId) {
        let connection;
        try {
            connection = await createDbConnection();
            const [rows] = await connection.execute(
                'SELECT id, name, phone FROM leads WHERE telegram_id = ? ORDER BY date DESC LIMIT 1',
                [chatId]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            logger.error('Foydalanuvchi ma\'lumotlarini olishda xatolik:', error);
            return null;
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (err) {
                    logger.error('Connection yopishda xatolik:', err);
                }
            }
        }
    }

    async startNewRegistration(chatId, groupId) {
        await this.bot.sendMessage(
            chatId,
            "Iltimos, to'liq ismingizni kiriting:"
        );

        const nameHandler = async (msg) => {
            const name = msg.text;
            this.bot.removeListener('message', nameHandler);

            await this.bot.sendMessage(
                chatId,
                "Telefon raqamingizni kiriting:\nMasalan: +998901234567"
            );

            const phoneHandler = async (msg) => {
                const phone = msg.text;
                this.bot.removeListener('message', phoneHandler);
                await this.saveLeadData(chatId, name, phone, groupId);
            };

            this.bot.on('message', phoneHandler);
        };

        this.bot.on('message', nameHandler);
    }

    async saveLeadData(chatId, name, phone, groupId) {
        let connection;
        try {
            connection = await createDbConnection();

            // Yangi lead yaratish
            const [leadResult] = await connection.execute(
                'INSERT INTO leads (name, phone, date) VALUES (?, ?, NOW())',
                [name, phone]
            );
            const leadId = leadResult.insertId;

            // New_lead jadvaliga ma'lumotlarni kiritish
            await connection.execute(
                `INSERT INTO new_lead (lead_id, created, time, target_id, status, action, direction_id) 
                 VALUES (?, NOW(), NOW(), 8, 'new', 'created', 
                 (SELECT direction_id FROM groups WHERE id = ?))`,
                [leadId, groupId]
            );

            await this.bot.sendMessage(
                chatId,
                "✅ Tabriklaymiz! Siz kursga muvaffaqiyatli ro'yxatdan o'tdingiz.\n\n" +
                "Tez orada operatorlarimiz siz bilan bog'lanishadi."
            );

        } catch (error) {
            logger.error('Ma\'lumotlarni saqlashda xatolik:', error);
            await this.bot.sendMessage(
                chatId,
                "❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
            );
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (err) {
                    logger.error('Connection yopishda xatolik:', err);
                }
            }
        }
    }
}

module.exports = UpcomingCourses; 
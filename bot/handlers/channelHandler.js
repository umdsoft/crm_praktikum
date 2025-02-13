const { createDbConnection } = require('../database/connection');
const config = require('../config/config');
const logger = require('../utils/logger');

async function handleChannelPost(bot, msg) {
    if (msg.chat.username === config.CHANNEL_USERNAME.replace('@', '')) {
        try {
            const db = await createDbConnection();
            const [users] = await db.execute('SELECT user_id FROM telegram_user WHERE status = ?', ['active']);
            
            for (const user of users) {
                try {
                    if (msg.text) {
                        await bot.sendMessage(user.user_id, msg.text);
                    } else if (msg.photo) {
                        await bot.sendPhoto(user.user_id, msg.photo[msg.photo.length - 1].file_id, { 
                            caption: msg.caption || '' 
                        });
                    } else if (msg.video) {
                        await bot.sendVideo(user.user_id, msg.video.file_id, { 
                            caption: msg.caption || '' 
                        });
                    } else if (msg.document) {
                        await bot.sendDocument(user.user_id, msg.document.file_id, { 
                            caption: msg.caption || '' 
                        });
                    }
                    await new Promise(resolve => setTimeout(resolve, 50));
                } catch (error) {
                    if (error.code === 403) {
                        await db.execute('UPDATE telegram_user SET status = ? WHERE user_id = ?', 
                            ['blocked', user.user_id]
                        );
                    }
                    logger.error(`Xabar yuborishda xatolik (user_id: ${user.user_id}):`, error);
                }
            }
            await db.end();
        } catch (error) {
            logger.error('Xabarni tarqatishda xatolik:', error);
        }
    }
}

module.exports = { handleChannelPost }; 
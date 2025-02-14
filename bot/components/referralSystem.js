const crypto = require('crypto');
const { createDbConnection } = require('../database/connection');
const logger = require('../utils/logger');

class ReferralSystem {
    constructor(bot) {
        if (!bot) {
            throw new Error('Bot instance is required');
        }
        this.bot = bot;
        this.POINTS_PER_REFERRAL = 10;
        this.WELCOME_POINTS = 10;
    }

    generateReferralCode(userId) {
        return crypto
            .createHash('md5')
            .update(userId.toString() + Date.now().toString())
            .digest('hex')
            .substring(0, 8);
    }

    async getOrCreateUser(userId, firstName, username = null) {
        let connection;
        try {
            connection = await createDbConnection();
            
            const [rows] = await connection.execute(
                'SELECT * FROM telegram_user WHERE user_id = ?',
                [userId]
            );

            if (rows.length > 0) {
                return rows[0];
            }

            const referralCode = this.generateReferralCode(userId);
            await connection.execute(
                `INSERT INTO telegram_user 
                (user_id, first_name, username, points, referral_code) 
                VALUES (?, ?, ?, ?, ?)`,
                [userId, firstName, username, this.WELCOME_POINTS, referralCode]
            );

            return {
                user_id: userId,
                first_name: firstName,
                username: username,
                points: this.WELCOME_POINTS,
                referral_code: referralCode
            };
        } catch (error) {
            logger.error('Error in getOrCreateUser:', error);
            throw error;
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (err) {
                    logger.error('Error closing connection:', err);
                }
            }
        }
    }

    async processReferral(referrerId, referredId) {
        let connection;
        try {
            if (referrerId === referredId) {
                return false;
            }

            connection = await createDbConnection();
            
            const [referred] = await connection.execute(
                'SELECT referred_by FROM telegram_user WHERE user_id = ?',
                [referredId]
            );

            if (referred.length > 0 && referred[0].referred_by) {
                return false;
            }

            await connection.execute(
                `UPDATE telegram_user 
                SET referred_by = ?, 
                    points = points + ? 
                WHERE user_id = ?`,
                [referrerId, this.WELCOME_POINTS, referredId]
            );

            await connection.execute(
                'UPDATE telegram_user SET points = points + ? WHERE user_id = ?',
                [this.POINTS_PER_REFERRAL, referrerId]
            );

            return true;
        } catch (error) {
            logger.error('Error in processReferral:', error);
            return false;
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (err) {
                    logger.error('Error closing connection:', err);
                }
            }
        }
    }

    async getReferralsCount(userId) {
        let connection;
        try {
            connection = await createDbConnection();
            const [rows] = await connection.execute(
                'SELECT COUNT(*) as count FROM telegram_user WHERE referred_by = ?',
                [userId]
            );
            return rows[0]?.count || 0;
        } catch (error) {
            logger.error('Error in getReferralsCount:', error);
            return 0;
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (err) {
                    logger.error('Error closing connection:', err);
                }
            }
        }
    }

    async getUserPoints(userId) {
        let connection;
        try {
            connection = await createDbConnection();
            const [rows] = await connection.execute(
                'SELECT points FROM telegram_user WHERE user_id = ?',
                [userId]
            );
            return rows[0]?.points || 0;
        } catch (error) {
            logger.error('Ballarni olishda xatolik:', error);
            return 0;
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

    async sendReferralInfo(chatId) {
        let connection;
        try {
            connection = await createDbConnection();
            const [rows] = await connection.execute(
                'SELECT * FROM telegram_user WHERE user_id = ?',
                [chatId]
            );
            
            if (rows.length === 0) {
                throw new Error('User not found');
            }

            const user = rows[0];
            const referralsCount = await this.getReferralsCount(chatId);
            const botUsername = (await this.bot.getMe()).username;

            const message = 
                `🎯 *Sizning referal ma'lumotlaringiz:*\n\n` +
                `🔗 *Referal havolangiz:*\n` +
                `https://t.me/${botUsername}?start=${user.referral_code}\n\n` +
                `👥 *Referallaringiz soni:* ${referralsCount} ta\n` +
                `💎 *Sizning ballaringiz:* ${user.points} ball\n\n` +
                `ℹ️ Har bir yangi referal uchun *${this.POINTS_PER_REFERRAL} ball* beriladi!`;

            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: "👥 Do'stlarni taklif qilish",
                            switch_inline_query: user.referral_code
                        }]
                    ]
                }
            });
        } catch (error) {
            logger.error('Error in sendReferralInfo:', error);
            throw error;
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (err) {
                    logger.error('Error closing connection:', err);
                }
            }
        }
    }

    async addPointsToUser(userId, points) {
        let connection;
        try {
            connection = await createDbConnection();
            await connection.execute(
                'UPDATE telegram_user SET points = points + ? WHERE user_id = ?',
                [points, userId]
            );
            return true;
        } catch (error) {
            logger.error('Ballarni qo\'shishda xatolik:', error);
            return false;
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

    async handleReferral(userId, referrerId) {
        if (referrerId) {
            await this.addPointsToUser(referrerId, 10);
        }
        await this.addPointsToUser(userId, 10);
    }

    async showReferralInfo(chatId, userId) {
        try {
            const points = await this.getUserPoints(userId);
            const botUsername = (await this.bot.getMe()).username;
            const referralLink = `https://t.me/${botUsername}?start=${userId}`;

            const message = 
                `🎯 Sizning ballaringiz: ${points}\n\n` +
                `🔗 Sizning referal havolangiz:\n${referralLink}\n\n` +
                `📝 Qoidalar:\n` +
                `- Har bir yangi a'zo uchun 10 ball\n` +
                `- Botga start bosganda 10 ball\n\n` +
                `📊 Do'stlaringizni taklif qiling va ko'proq ball to'plang!`;

            await this.bot.sendMessage(chatId, message);
            return true;
        } catch (error) {
            logger.error('Referral ma\'lumotlarini ko\'rsatishda xatolik:', error);
            return false;
        }
    }
}

module.exports = ReferralSystem; 
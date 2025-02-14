const { createDbConnection } = require('../database/connection');
const logger = require('../utils/logger');

class AttendanceNotifier {
    constructor(bot) {
        console.log('AttendanceNotifier yaratildi');
        if (!bot) {
            console.error('Bot obyekti topilmadi!');
            return;
        }
        this.bot = bot;
        console.log('Bot obyekti ulandi');
        
        // Constructor ichida darhol ishga tushirish
        console.log('Dastlabki tekshiruv boshlanmoqda...');
        this.sendAttendanceReports()
            .then(() => console.log('Dastlabki tekshiruv tugadi'))
            .catch(error => console.error('Dastlabki tekshiruvda xatolik:', error));

        // Intervalni ishga tushirish
        this.startNotification();
    }

    startNotification() {
        console.log('Notification interval ishga tushdi');
        // Har 1 daqiqada tekshirish (test uchun)
        setInterval(() => {
            console.log('\n--- Yangi tekshiruv boshlandi ---');
            console.log('Vaqt:', new Date().toLocaleString());
            
            this.sendAttendanceReports()
                .then(() => console.log('Tekshiruv muvaffaqiyatli yakunlandi'))
                .catch(error => console.error('Tekshiruvda xatolik:', error));
                
        }, 60 * 1000); // har daqiqada
    }

    async sendAttendanceReports() {
        let connection;
        try {
            connection = await createDbConnection();
            
            console.log('Bazaga ulanish amalga oshirildi');
            
            // Faol guruhlarni olish
            const [activeGroups] = await connection.execute(
                'SELECT id, name, chat_id FROM `groups` WHERE status = 1 AND chat_id IS NOT NULL'
            );

            console.log('Topilgan guruhlar:', activeGroups);

            for (const group of activeGroups) {
                try {
                    const [attendances] = await connection.execute(
                        `SELECT 
                            gsc.*, 
                            s.full_name
                        FROM 
                            group_student_checkup gsc
                            JOIN students s ON gsc.student_id = s.id
                        WHERE 
                            gsc.group_id = ? 
                            AND DATE(gsc.created_at) = CURDATE()
                        ORDER BY 
                            gsc.created_at DESC`,
                        [group.id]
                    );

                    console.log(`${group.name} guruhi uchun yo'qlamalar:`, attendances);

                    if (attendances.length > 0) {
                        let message = `📊 ${group.name} guruhi uchun bugungi yo'qlama:\n\n`;
                        
                        let present = 0;
                        let absent = 0;
                        let late = 0;

                        attendances.forEach(record => {
                            const status = record.status === 1 ? '✅' : 
                                         record.status === 0 ? '❌' : 
                                         record.status === 2 ? '⚠️' : '❓';
                            
                            message += `${status} ${record.full_name}\n`;

                            if (record.status === 1) present++;
                            else if (record.status === 0) absent++;
                            else if (record.status === 2) late++;
                        });

                        message += `\n📈 Statistika:\n`;
                        message += `✅ Keldi: ${present}\n`;
                        message += `❌ Kelmadi: ${absent}\n`;
                        message += `⚠️ Kechikdi: ${late}\n`;
                        message += `\nUmumiy: ${attendances.length}`;

                        console.log('Yuborilayotgan xabar:', message);
                        console.log('Guruh chat ID:', group.chat_id);

                        try {
                            await this.bot.sendMessage(group.chat_id, message);
                            console.log(`✅ Xabar muvaffaqiyatli yuborildi: ${group.name}`);
                        } catch (sendError) {
                            console.error(`❌ Xabar yuborishda xatolik: ${group.name}`, sendError);
                        }
                    } else {
                        console.log(`ℹ️ ${group.name} guruhi uchun bugun yo'qlamalar topilmadi`);
                    }
                } catch (groupError) {
                    console.error(`❌ ${group.name} guruhi uchun xatolik:`, groupError);
                }
            }
        } catch (error) {
            console.error('❌ Asosiy xatolik:', error);
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (err) {
                    console.error('❌ Connection yopishda xatolik:', err);
                }
            }
        }
    }
}

module.exports = AttendanceNotifier; 
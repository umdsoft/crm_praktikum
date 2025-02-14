const TelegramBot = require('node-telegram-bot-api');
const config = require('./config/config');
const logger = require('./utils/logger');
const QuestionHandler = require('./handlers/questionHandler');
const CommandHandler = require('./handlers/commandHandler');
const AttendanceNotifier = require('./components/attendanceNotifier');

try {
    const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });
    logger.info('Bot ishga tushdi ✅');

    // Handlerlarni yaratish
    const questionHandler = new QuestionHandler(bot, config.SUPPORT_GROUP_ID);
    const commandHandler = new CommandHandler(bot);

    // Bot ma'lumotlarini tekshirish
    bot.getMe().then(botInfo => {
        console.log('\n=== BOT MA\'LUMOTLARI ===');
        console.log('ID:', botInfo.id);
        console.log('Username:', botInfo.username);
        console.log('Name:', botInfo.first_name);
        console.log('========================\n');
    });

    // Start komandasi
    bot.onText(/\/start/, async (msg) => {
        await commandHandler.handleStart(msg);
    });

    // Kontakt ma'lumotlarini qabul qilish
    bot.on('contact', async (msg) => {
        await commandHandler.handleContact(msg);
    });

    // Asosiy xabarlarni qayta ishlash
    bot.on('message', async (msg) => {
        // Guruhdan kelgan xabarlar uchun
        if (msg.chat.id === config.SUPPORT_GROUP_ID) {
            await questionHandler.handleGroupReply(msg);
            return;
        }

        // Shaxsiy xabarlar uchun
        if (msg.chat.type === 'private' && msg.text && !msg.text.startsWith('/')) {
            const isHandled = await commandHandler.handleButtons(msg);
            if (!isHandled) {
                await questionHandler.handleUserQuestion(msg);
            }
        }
    });

    // Xatoliklarni qayta ishlash
    bot.on('polling_error', (error) => {
        logger.error('Xatolik yuz berdi:', error.message);
    });

    // Bot ishga tushganda
    bot.on('ready', () => {
        // Yo'qlama notifikatsiyasini ishga tushirish
        new AttendanceNotifier(bot);
    });

    logger.info('Bot muvaffaqiyatli ishga tushdi');

} catch (error) {
    logger.error('Botni ishga tushirishda xatolik:', error.message);
}
async function handleMessage(bot, msg) {
    if (msg.text && !msg.text.startsWith('/')) {
        const chatId = msg.chat.id;
        
        switch(msg.text) {
            case "📚 Kurslar haqida ma'lumot":
                await bot.sendMessage(chatId, "🎓 Bizning kurslarimiz...");
                break;
            case "📝 Ro'yhatdan o'tish":
                await bot.sendMessage(chatId, "✍️ Ro'yhatdan o'tish...");
                break;
            case "📍 Manzilni ko'rish":
                await bot.sendMessage(chatId, "🏢 Bizning manzil...");
                break;
            case "📞 Aloqa":
                await bot.sendMessage(chatId, "📱 Biz bilan bog'lanish...");
                break;
        }
    }
}

module.exports = { handleMessage }; 
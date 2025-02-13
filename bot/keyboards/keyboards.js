const mainKeyboard = {
    keyboard: [
        ["📚 Kurslar haqida ma'lumot", "📝 Ro'yhatdan o'tish"],
        ["📍 Manzilni ko'rish", "📞 Aloqa"]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
};

const subscriptionKeyboard = {
    inline_keyboard: [
        [{ text: '✅ Obunani tekshirish', callback_data: 'check_subscription' }]
    ]
};

module.exports = {
    mainKeyboard,
    subscriptionKeyboard
}; 
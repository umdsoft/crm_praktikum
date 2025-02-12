const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql2');

// Telegram bot tokeni
const TELEGRAM_BOT_TOKEN = '8079679921:AAGsFJYU9i_3A2wecieSEJmVyC4m_lfqy-M';
const CHANNEL_ID = '@praktikum_academy'; // Kanal username
const VIDEO_LINK = 'https://www.youtube.com/watch?v=p4R1xCjOfto'; // YouTube video linki

// MySQL ulanish parametrlari
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // MySQL foydalanuvchi nomi
  password: '', // MySQL paroli (bo'sh bo'lsa '' qoldiring)
  database: 'telegram_bot'
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL bazasiga ulandi!');
});

// // Botni ishga tushirish
// const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// console.log('Bot ishga tushdi...');

// // Foydalanuvchi bazada mavjudligini tekshirish
// function isUserRegistered(userId, callback) {
//   db.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, results) => {
//       if (err) {
//           console.error('Bazadan ma\'lumot olishda xatolik:', err);
//           callback(false);
//       } else {
//           callback(results.length > 0); // Agar foydalanuvchi topilsa true, aks holda false
//       }
//   });
// }

// // Obuna bo'lishni tekshirish
// function checkSubscription(userId, callback) {
//   bot.getChatMember(CHANNEL_USERNAME, userId)
//       .then(member => {
//           if (member.status === 'member' || member.status === 'administrator' || member.status === 'creator') {
//               callback(true); // Obuna bo'lgan
//           } else {
//               callback(false); // Obuna bo'lmagan
//           }
//       })
//       .catch(err => {
//           console.error('Obuna tekshirishda xatolik:', err);
//           callback(false); // Xatolik yuzaga kelganda ham false qaytarish
//       });
// }

// // Xabarlarni o'chirish funksiyasi
// function deleteMessages(chatId, messageIds) {
//   messageIds.forEach(messageId => {
//       bot.deleteMessage(chatId, messageId)
//           .catch(err => {
//               console.error(`Xabar ${messageId} o'chirishda xatolik:`, err);
//           });
//   });
// }

// // Start komandasini ishlatish
// bot.onText(/\/start/, async (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const username = msg.from.username || null;
//   const firstName = msg.from.first_name || null;
//   const lastName = msg.from.last_name || null;

//   // Foydalanuvchi allaqachon ro'yxatdan o'tganmi?
//   isUserRegistered(userId, (isRegistered) => {
    

//       // Yangi foydalanuvchini bazaga saqlash
//       db.query(
//           'INSERT INTO users (user_id, username, first_name, last_name) VALUES (?, ?, ?, ?)',
//           [userId, username, firstName, lastName],
//           (err, result) => {
//               if (err) {
//                   console.error('Ma\'lumotlarni saqlashda xatolik:', err);
//                   bot.sendMessage(chatId, "Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
//               } else {
//                   console.log(`Foydalanuvchi saqlandi: ${userId}`);
//                   bot.sendMessage(chatId, `Iltimos, avval bizning kanalimizga obuna bo'ling: ${CHANNEL_USERNAME}`, {
//                       reply_markup: {
//                           inline_keyboard: [
//                               [{ text: 'Obunani tekshirish', callback_data: 'check_subscription' }]
//                           ]
//                       }
//                   }).then(sentMessage => {
//                       // Jo'natilgan xabar ID-sini saqlash
//                       db.query(
//                           'UPDATE users SET message_id = ? WHERE user_id = ?',
//                           [sentMessage.message_id, userId],
//                           (err, result) => {
//                               if (err) console.error('Xabar ID-sini saqlashda xatolik:', err);
//                           }
//                       );
//                   });
//               }
//           }
//       );
//   });
// });

// // Callback queryni ishlatish
// bot.on('callback_query', (query) => {
//   const chatId = query.message.chat.id;
//   const userId = query.from.id;
//   const messageId = query.message.message_id;

//   if (query.data === 'check_subscription') {
//       checkSubscription(userId, (isSubscribed) => {
//           if (isSubscribed) {
//               // Agar obuna bo'lgan bo'lsa
//               bot.sendMessage(chatId, `YouTube videoni ko'rish uchun quyidagi havolani bosing: ${VIDEO_LINK}`);

//               // Tugmani o'chirish va barcha habarlarni o'chirish
//               bot.editMessageReplyMarkup(
//                   { inline_keyboard: [] },
//                   { chat_id: chatId, message_id: messageId }
//               ).catch(err => {
//                   console.error('Tugmani o‘chirishda xatolik:', err);
//               });

//               // Barcha habarlarni o'chirish
//               db.query('SELECT message_id FROM users WHERE user_id = ?', [userId], (err, results) => {
//                   if (err) {
//                       console.error('Xabar ID-larini olishda xatolik:', err);
//                   } else {
//                       const messageIds = results.map(row => row.message_id);
//                       deleteMessages(chatId, messageIds);
//                   }
//               });
//           } else {
//               // Agar obuna bo'lmagan bo'lsa
//               bot.sendMessage(chatId, `Iltimos, avval bizning kanalimizga obuna bo'ling: ${CHANNEL_USERNAME}`);
//           }
//       });
//   }
// });

// Botni ishga tushirish
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
// Foydalanuvchilar holati
const userStates = {};

// Savollar va ularning javob variantlari
const questions = [
    "Ism familiyangiz?",
    "Qaysi tuman(shahar)dansiz?",
    "Qaysi maktabda o'qiysiz?",
    "Qaysi sinf o'quvchisisiz?",
    "O‘zingizni kelajakda qanday tasavvur qilasiz?",
    "Sizni hozirda eng ko‘p tashvishga solayotgan muammo nima? (Bir nechtasini tanlang)",
    "Agar 1 yil oldinga nazar solsangiz, o‘zingizni qanday tasavvur qilasiz?",
    "Sizningcha, hozir o‘zingizni rivojlantirish uchun qanday imkoniyatlardan foydalanish kerak?",
    "Agar sizga o‘qish va imtihonlarga tayyorlanishda yordam beradigan sun’iy intellekt tizimi mavjud bo‘lsa, foydalanarmidingiz?",
    "O‘zingizni rivojlantirish uchun qanday imkoniyatlarni izlayapsiz?",
    "Agar sizga zamonaviy texnologiyalar orqali o‘qish samaradorligini oshirish imkoniyati berilsa, bunga tayyormisiz?",
    "Sun’iy intellekt yordamida o‘qish va imtihonlardan muvaffaqiyatli o‘tish bo‘yicha BEPUL master-klassda ishtirok etishni xohlaysizmi?",
    "Hozirgi vaqtda zamonaviy kasblar haqida qanchalik bilasiz?",
    "Siz qaysi zamonaviy kasblarga qiziqasiz? (Bir nechtasini tanlang)",
    "Sizningcha, kelajakda qaysi kasblar eng talabgir bo‘ladi?",
    "Agar sizga 2-3 oy ichida zamonaviy kasb o‘rganish va daromad topish imkoniyati bersa, qaysi sohani tanlardingiz?"
];

// Har bir savol uchun javob variantlari
const answerOptions = [
    [], // Ism familiya uchun javob variantlari yo'q
    ["Xonqa tuman", "Urganch shahar", "Shovot"], // Tumanlar ro'yxati
    ["5-maktab", "22-maktab", "48-maktab"], // Maktablar ro'yxati
    ["9-sinf", "10-sinf", "11-sinf"], // Sinflar ro'yxati
    ["Kuchli mutaxassis sifatida yaxshi daromad topaman", "O‘z biznesimni boshlash"],
    ["Chet tilini o‘rganish qiyin", "Imtihonlarga tayyorlanish qiyin"],
    ["O‘zimga ishonchim ortgan, kelajak rejam aniq bo‘lgan bo‘ladi", "O‘z kasbimni topgan va unga tayyorgarlik ko‘rayotgan bo‘laman"],
    ["Zamonaviy kasb o‘rganish (IT, dizayn, SMM)", "O‘qish samaradorligini oshirish"],
    ["Ha", "Yo‘q"],
    ["O‘qish va imtihonlarga tayyorlanish", "Frilanser bo‘lish uchun kerakli ko‘nikmalarni o‘rganish"],
    ["Ha", "Yo‘q"],
    ["Ha", "Yo‘q"],
    ["Ha, men ularni yaxshi bilaman va o‘rganmoqchiman", "Yo‘q, men bu haqida umuman o‘ylab ko‘rmaganman"],
    ["IT va dasturlash (Web dasturlash, Sun’iy intellekt, Python)", "Grafik dizayn (Logotiplar, bannerlar, UI/UX)"],
    ["Dasturlash va IT mutaxassislari", "Marketing va SMM mutaxassislari"],
    ["IT va dasturlash (Web, Python, Sun’iy intellekt)", "O‘z biznesimni boshlash (Startap, brend yaratish)"]
];

// Start komandasini ishlatish
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        // Kanalga a'zo bo'lishni tekshirish
        const member = await bot.getChatMember(CHANNEL_ID, userId);
        if (member.status === 'member' || member.status === 'administrator' || member.status === 'creator') {
            // Telefon raqamini so'raymiz
            bot.sendMessage(chatId, "Iltimos, telefon raqamingizni jo'nating:", {
                reply_markup: {
                    keyboard: [[{ text: "Telefon raqamini jo'natish", request_contact: true }]],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
        } else {
            // Kanalga a'zo bo'lmagan bo'lsa, xabar yuboramiz
            bot.sendMessage(chatId, `Iltimos, avval ${CHANNEL_ID} kanaliga a'zo bo'ling.`, {
                reply_markup: {
                    inline_keyboard: [[{ text: "Obuna bo'lish", url: `https://t.me/${CHANNEL_ID.replace('@', '')}` }]]
                }
            });
        }
    } catch (error) {
        console.error("Kanalga a'zolikni tekshirishda xatolik:", error);
        bot.sendMessage(chatId, "Kanalga a'zolikni tekshirishda xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
});

// Kontakt (telefon raqami) qabul qilish
bot.on('contact', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const phoneNumber = msg.contact.phone_number;

    try {
        // Telefon raqamini bazaga saqlash
        db.query(
            'INSERT INTO users (user_id, phone_number) VALUES (?, ?) ON DUPLICATE KEY UPDATE phone_number = ?',
            [userId, phoneNumber, phoneNumber],
            (err, result) => {
                if (err) {
                    console.error('Telefon raqamini saqlashda xatolik:', err);
                    bot.sendMessage(chatId, "Telefon raqamini saqlashda xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
                } else {
                    // So'rovnomani boshlash tugmasini chiqarish
                    bot.sendMessage(chatId, "Telefon raqamingiz saqlandi! So'rovnomani boshlash uchun quyidagi tugmani bosing:", {
                        reply_markup: {
                            inline_keyboard: [[{ text: "So'rovnomani boshlash", callback_data: "start_survey" }]]
                        }
                    });
                }
            }
        );
    } catch (error) {
        console.error("Telefon raqamini saqlashda xatolik:", error);
        bot.sendMessage(chatId, "Telefon raqamini saqlashda xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
});

// So'rovnomani boshlash va javoblarni qayta ishlash
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const answer = query.data;

    try {
        // Agar so'rovnomani boshlash tugmasi bosilgan bo'lsa
        if (answer === "start_survey") {
            // Foydalanuvchini holatini boshlash
            userStates[userId] = { currentQuestion: 0, answers: {} };
            sendNextQuestion(chatId, userId);
            return; // Keyingi qadamlarga o'tirmaslik uchun return qilamiz
        }

        // Javobni saqlash va keyingi savolni jo'natish
        const currentState = userStates[userId];
        const currentQuestionIndex = currentState.currentQuestion;

        // Javobni saqlash
        currentState.answers[currentQuestionIndex + 1] = answer;

        // Keyingi savolga o'tish
        currentState.currentQuestion++;
        sendNextQuestion(chatId, userId);

    } catch (error) {
        console.error("Callback queryni ishlashda xatolik:", error);
    }
});

// Matnli javoblarni qayta ishlash
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    try {
        // Agar foydalanuvchi holati mavjud bo'lsa
        const currentState = userStates[userId];
        if (!currentState) {
            bot.sendMessage(chatId, "Iltimos, /start buyrug'ini yuboring.");
            return;
        }

        const currentQuestionIndex = currentState.currentQuestion;

        // Javobni saqlash
        currentState.answers[currentQuestionIndex + 1] = text;

        // Keyingi savolga o'tish
        currentState.currentQuestion++;
        sendNextQuestion(chatId, userId);

    } catch (error) {
        console.error("Matnli javobni qayta ishlashda xatolik:", error);
    }
});

// Keyingi savolni jo'natish funksiyasi
function sendNextQuestion(chatId, userId) {
    try {
        const currentState = userStates[userId];
        const currentQuestionIndex = currentState.currentQuestion;

        if (currentQuestionIndex < questions.length) {
            const question = questions[currentQuestionIndex];
            let replyMarkup = {};

            // Agar savol uchun javob variantlari mavjud bo'lsa
            if (answerOptions[currentQuestionIndex].length > 0) {
                const options = answerOptions[currentQuestionIndex];
                replyMarkup = {
                    reply_markup: {
                        inline_keyboard: [options.map(option => ({ text: option, callback_data: option }))]
                    }
                };
            }

            bot.sendMessage(chatId, question, replyMarkup);
        } else {
            // So'rovnoma tugaganda
            saveAnswersToDatabase(userId, currentState.answers);
            bot.sendMessage(chatId, "So'rovnoma tugadi! Rahmat!");
        }
    } catch (error) {
        console.error("Keyingi savolni jo'natishda xatolik:", error);
    }
}

// Javoblarni bazaga saqlash funksiyasi
function saveAnswersToDatabase(userId, answers) {
    try {
        const values = Object.keys(answers).map(key => answers[key]);
        values.unshift(userId);
        db.query(
            'INSERT INTO survey_responses (user_id, answer_1, answer_2, answer_3, answer_4, answer_5, answer_6, answer_7, answer_8, answer_9) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            values,
            (err, result) => {
                if (err) {
                    console.error('Javoblarni saqlashda xatolik:', err);
                } else {
                    console.log(`Foydalanuvchi ${userId} javoblari saqlandi.`);
                }
            }
        );
    } catch (error) {
        console.error("Javoblarni saqlashda xatolik:", error);
    }
}
const { createDbConnection } = require("../database/connection");
const logger = require("../utils/logger");
const sendUpcomingCourses = require("../components/upcomingCourses");
const ReferralSystem = require("../components/referralSystem");
const { createAdminMessage } = require("../components/upcomingCourses");

class CommandHandler {
  constructor(bot) {
    this.bot = bot;
    this.referralSystem = new ReferralSystem(bot);
    this.mainKeyboard = {
      reply_markup: {
        keyboard: [
          ["📚 Kurslar haqida ma'lumot"],
          ["📝 Yaqin kunlarda ochiladigan kurslar ro'yxati"],
          ["📝 Kurslarga ro'yhatdan o'tish"],
          ["📍 Manzilni ko'rish"],
          ["📞 Aloqa"],
          ["👥 Referallar"],
        ],
        resize_keyboard: true,
      },
    };

    this.phoneKeyboard = {
      reply_markup: {
        keyboard: [
          [
            {
              text: "📱 Telefon raqamni yuborish",
              request_contact: true,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };

    // UpcomingCourses classini konstruktorda yaratamiz
    this.upcomingCourses = new sendUpcomingCourses(this.bot);

    // Callback query'larni qayta ishlash
    this.bot.on("callback_query", async (query) => {
      try {
        const chatId = query.message.chat.id;
        const userId = query.from.id;
        const username = query.from.username || "username mavjud emas";
        const firstName = query.from.first_name || "";
        const lastName = query.from.last_name || "";

        if (query.data.startsWith("register_group:")) {
          const groupId = query.data.split(":")[1];

          // Bazadan telefon raqamni olish
          const db = await createDbConnection();
          const [rows] = await db.execute(
            "SELECT phone_number FROM telegram_user WHERE user_id = ?",
            [userId]
          );

          const phoneNumber =
            rows.length > 0 ? rows[0].phone_number : "Kiritilmagan";

          // Admin guruhiga xabar yuborish
          const adminGroupId = process.env.SUPPORT_GROUP_ID;
          const adminMessage = `🎯 Yangi o'quvchi ro'yxatdan o'tmoqda:

👤 Ism: ${firstName} ${lastName}
🔗 Username: @${username}
🆔 Telegram ID: ${userId}
📱 Telefon: ${phoneNumber}

📚 Tanlangan guruh: ${groupId}

⏰ Vaqt: ${new Date().toLocaleString("uz-UZ")}`;

          await this.bot.sendMessage(adminGroupId, adminMessage);

          // Foydalanuvchiga tasdiqlash xabari
          await this.bot.sendMessage(
            chatId,
            "✅ Sizning so'rovingiz qabul qilindi!\n\n" +
              "Tez orada administratorlarimiz siz bilan bog'lanishadi."
          );

          // Callback query'ni yopish
          await this.bot.answerCallbackQuery(query.id);

          // Bazani yopish
          await db.end();
        }
      } catch (error) {
        logger.error("Callback query ishlovida xatolik:", error);
        await this.bot.sendMessage(
          query.message.chat.id,
          "❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
        );
      }
    });
  }

  async checkUserRegistration(userId) {
    let connection;
    try {
      connection = await createDbConnection();
      const [rows] = await connection.execute(
        "SELECT * FROM telegram_user WHERE user_id = ?",
        [userId]
      );
      return rows[0];
    } catch (error) {
      logger.error("Database tekshirish xatosi:", error);
      return null;
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (err) {
          logger.error("Connection yopishda xatolik:", err);
        }
      }
    }
  }

  async saveUser(userId, firstName, username, referrerId = null) {
    let connection;
    try {
      connection = await createDbConnection();
      await connection.execute(
        "INSERT INTO telegram_user (user_id, first_name, username, points, created_at) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE first_name = ?, username = ?",
        [userId, firstName, username, 0, firstName, username]
      );

      // Handle referral points through referral system
      await this.referralSystem.handleReferral(userId, referrerId);
      return true;
    } catch (error) {
      logger.error("Foydalanuvchini saqlashda xatolik:", error);
      return false;
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (err) {
          logger.error("Connection yopishda xatolik:", err);
        }
      }
    }
  }

  async updateUserPhone(userId, phoneNumber) {
    let connection;
    try {
      connection = await createDbConnection();
      await connection.execute(
        "UPDATE telegram_user SET phone_number = ?, is_registered = TRUE WHERE user_id = ?",
        [phoneNumber, userId]
      );
      return true;
    } catch (error) {
      logger.error("Telefon raqamni saqlashda xatolik:", error);
      return false;
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (err) {
          logger.error("Connection yopishda xatolik:", err);
        }
      }
    }
  }

  // Start komandasi
  async handleStart(msg) {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const firstName = msg.from.first_name;

      // Check for referral parameter
      const referrerId = msg.text.split(" ")[1];

      // Foydalanuvchini tekshirish
      const userInfo = await this.checkUserRegistration(userId);

      // Yangi foydalanuvchini saqlash
      if (!userInfo) {
        await this.saveUser(userId, firstName, msg.from.username, referrerId);
      }

      // Telefon raqam so'rash
      const welcomeMessage =
        `Assalomu alaykum, ${firstName}! 😊\n\n` +
        `Botdan foydalanish uchun telefon raqamingizni yuborish tugmasini bosing 👇`;

      await this.bot.sendMessage(chatId, welcomeMessage, this.phoneKeyboard);
    } catch (error) {
      logger.error("Start komandasi xatosi:", error);
      await this.bot.sendMessage(
        msg.chat.id,
        "Xatolik yuz berdi. Iltimos, /start ni qayta bosing."
      );
    }
  }

  async handleContact(msg) {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const contact = msg.contact;
      const firstName = msg.from.first_name;

      // Telefon raqam o'zining ekanligini tekshirish
      if (contact.user_id !== userId) {
        await this.bot.sendMessage(
          chatId,
          "⚠️ Iltimos, o'zingizning telefon raqamingizni yuboring.",
          this.phoneKeyboard
        );
        return;
      }

      // Telefon raqamni bazaga saqlash
      const saved = await this.updateUserPhone(userId, contact.phone_number);

      if (saved) {
        const welcomeMessage =
          `🎉 Bizning safimizga Xush kelibsiz ${firstName}!\n\n` +
          `Siz Praktikum Academyning rasmiy botiga keldingiz! 🚀\n` +
          `Bu yerda siz tez va oson tarzda kurslarga yozilish, dars jadvalini bilish va zarur ma'lumotlarni olish imkoniyatiga egasiz.\n` +
          `\n` +
          `📌 Nima qilish kerak? \n` +
          `1️⃣ Tugmalardan foydalanib, kerakli bo'limni tanlang.\n` +
          `2️⃣ Ro'yxatdan o'tish uchun kerakli kursni tanlang va ro'yhatdan o'ting.\n` +
          `3️⃣ Hammasi tayyor! Bizning jamoamiz siz bilan tez orada bog'lanadi.\n\n` +
          `🙋‍♂️Agar savollaringiz bo'lsa bemalol bizga jo'nating. Quyidagi tugmalardan birini tanlang 👇`;

        await this.bot.sendMessage(chatId, welcomeMessage, this.mainKeyboard);
      } else {
        throw new Error("Telefon raqamni saqlashda xatolik");
      }
    } catch (error) {
      logger.error("Kontakt saqlashda xatolik:", error);
      await this.bot.sendMessage(
        msg.chat.id,
        "❌ Xatolik yuz berdi. Iltimos, /start ni qayta bosing."
      );
    }
  }

  // Asosiy tugmalar
  async handleButtons(msg) {
    // Tekshiramiz msg va chat.id borligini
    if (!msg || !msg.chat || !msg.chat.id) {
      logger.error("Message or chat.id is missing");
      return false;
    }

    const chatId = msg.chat.id;

    switch (msg.text) {
      case "📚 Kurslar haqida ma'lumot":
        await this.bot.sendMessage(
          chatId,
          "Bizning kurslarimiz:\n\n" +
            "1. Frontend Development\n" +
            "2. Backend Development\n" +
            "3. Mobile Development\n\n" +
            "Qaysi kurs haqida ma'lumot olishni xohlaysiz?"
        );
        break;

      case "📝 Yaqin kunlarda ochiladigan kurslar ro'yxati":
        try {
          // chatId ni tekshiramiz
          if (!chatId) {
            throw new Error("Chat ID is missing");
          }

          // Mavjud upcomingCourses obyektini ishlatamiz
          await this.upcomingCourses.sendUpcomingCourses(chatId);
        } catch (error) {
          logger.error("Kurslar haqida ma'lumot yuborishda xatolik:", error);
          if (chatId) {
            await this.bot.sendMessage(
              chatId,
              "❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
            );
          }
        }
        break;

      case "📝 Kurslarga ro'yhatdan o'tish":
        await this.bot.sendMessage(
          chatId,
          "Kurslarga ro'yhatdan o'tish uchun quyidagi ma'lumotlarni yuboring:\n\n" +
            "1. To'liq ismingiz\n" +
            "2. Telefon raqamingiz\n" +
            "3. Tanlagan kursingiz\n\n" +
            "Quyidagi kurslardan birini tanlang:\n" +
            "- Frontend Development\n" +
            "- Backend Development\n" +
            "- Mobile Development"
        );
        break;

      case "📍 Manzilni ko'rish":
        try {
          // Avval manzil matni yuboriladi
          await this.bot.sendMessage(
            chatId,
            "📍 Bizning manzil: Urganch shahri, Xonqa ko'chasi 36/1 uy"
          );

          // Keyin lokatsiya yuboriladi
          await this.bot.sendLocation(
            chatId,
            41.543292, // Latitude - o'zgartiring
            60.628826 // Longitude - o'zgartiring
          );

          // Qo'shimcha ma'lumot
          await this.bot.sendMessage(
            chatId,
            "🚗 Mo'ljal: Urganch shahar Elektroset\n" +
              "📞 Telefon: +998 78 113 7008\n"
          );
        } catch (error) {
          logger.error("Lokatsiya yuborishda xatolik:", error.message);
          await this.bot.sendMessage(
            chatId,
            "❌ Lokatsiyani yuborishda xatolik yuz berdi."
          );
        }
        break;

      case "📞 Aloqa":
        await this.bot.sendMessage(
          chatId,
          "Biz bilan bog'lanish:\n\n" +
            "☎️ Tel: +998 90 123 45 67\n" +
            "📧 Email: info@example.com\n" +
            "🌐 Web: www.example.com"
        );
        break;

      case "👥 Referallar":
        await this.referralSystem.showReferralInfo(chatId, msg.from.id);
        break;

      default:
        return false;
    }
    return true;
  }
}

module.exports = CommandHandler;

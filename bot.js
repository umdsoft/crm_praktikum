require("dotenv").config({ path: ".env" });
const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply("Welcome!", {
    reply_markup: {
      keyboard: [
        ["📚 Books", "🎬 Movies"],
        ["🎵 Music"],
      ],
      resize_keyboard: true,
    },
  });
});

bot.launch();

const e = require("express");
const Reklama = require("../models/Reklama");
const ShortUrl = require("../models/ShortUrl");
const { generateRandomText } = require("../setting/randomString");
exports.createAds = (req, res) => {
  try {
    // https://praktikum-academy.uz/register?utm_source=google&utm_medium=cpc&utm_campaign=summer_sale
    const num = Math.floor(Math.random() * 1000) + 10;
    const code = `${generateRandomText(21)}${num}`;
    const short_url = `https://praktikum-academy.uz/ads?link=${code}$`;
    const url = `https://praktikum-academy.uz/register?utm_source=${req.body.utm_source}&utm_medium=${req.body.utm_medium}&utm_campaign=${req.body.utm_campaign}&utm_content=${req.body.utm_content}&utm_id=${code}`;
    ShortUrl.query()
      .insert({
        url: url,
        short_url: short_url,
        created: new Date(),
        short: code,
      })
      .then((data) => {
        Reklama.query()
          .insert({
            link: url,
            short_url: data.id,
            created_date: new Date(),
            created_time: new Date(),
            utm_source: req.body.utm_source,
            utm_medium: req.body.utm_medium,
            utm_campaign: req.body.utm_campaign,
            utm_content: req.body.utm_content,
            utm_id: code,
            target_id: req.body.target_id,
            name: req.body.name,
            budjet: req.body.budjet,
            status: 1,
          })
          .then((data) => {
            return res.status(200).json({ success: true });
          });
      });
  } catch (e) {
    console.log(e);
  }
};

exports.getAds = async (req, res) => {
  const limit = req.query.limit || 15;
  const skip = (req.query.page - 1) * limit;
  const ads = await Reklama.query()
    .orderBy("id", "desc")
    .limit(limit)
    .offset(skip);
  return res.status(200).json({ success: true, data: ads });
};

exports.getLink = async (req, res) => {
  const link = await ShortUrl.query().where("short", req.params.id).first();
  return res.status(200).json({ success: true, data: link });
};

const AdForm = require("../models/AdForm");

exports.createAdForm = async (req, res) => {
  try {
    // Hash generatsiya qilish funksiyasi
    function generateCustomHash() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx-xxxxxxxx-xxxxxx-xxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
    }

    // Unik hash olish uchun funksiya
    async function getUniqueHash() {
      let hash = generateCustomHash();
      let existingRecord = await AdForm.query().findOne({ link: hash });

      // Agar hash bazada mavjud bo‘lsa, qayta generatsiya qilamiz
      while (existingRecord) {
        hash = generateCustomHash();
        existingRecord = await AdForm.query().findOne({ link: hash });
      }

      return hash;
    }

    // Unik hashni olish va bazaga yozish
    const uniqueHash = await getUniqueHash();
    await AdForm.query().insert({
      name: req.body.name,
      target_id: req.body.target_id,
      amount: req.body.amount,
      created: new Date(),
      link: uniqueHash,
      direction_id: req.body.direction_id,
    });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.log("Xatolik yuz berdi:", e);
  }
};

exports.getData = async (req, res) => {
  try {
    const con = await AdForm.query().findOne("link", req.params.id);
    if (!con) {
      return res.status(200).json({ success: false });
    }
    return res.status(200).json({ success: true, data: con });
  } catch (e) {
    console.log(e);
  }
};

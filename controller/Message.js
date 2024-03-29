const MessageModel = require("../models/Message");

exports.createMessage = async (req, res) => {
  try {
    // type - 1 | Reklama
    // type - 2 | Qarzdorlik
    // type - 3 | To'lov
    await MessageModel.query().insert(req.body);
    return res.status(201).json({ success: true });
  } catch (e) {
    return res.status(400).json({ success: false, error: e.message });
  }
};

exports.getAllMessage = async (req, res) => {
  const limit = req.query.limit || 15;
  const skip = (req.query.page - 1) * limit;
  let allMessage;
  if (req.query.search) {
    console.log(req.query.search);
    allMessage = await MessageModel.query()
      .where("phone", "like", `%${req.query.search}%`)
      .select("*")
      .orderBy("id", "desc")
      .limit(limit)
      .offset(skip);
  } else {
    allMessage = await MessageModel.query()
      .select("*")
      .orderBy("id", "desc")
      .limit(limit)
      .offset(skip);
  }
  return res
    .status(200)
    .json({
      success: true,
      data: allMessage,
      total: allMessage.length,
      limit: limit,
    });
};

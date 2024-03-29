const Lead = require("../models/leads");
const LeadInterested = require("../models/lead_interested");
const Target = require("../models/target");
exports.create = async (req, res) => {
  try {
    await Lead.query().insert({
      name: req.body.full_name,
      phone: req.body.phone,
      target_id: req.body.target,
      edit_date: new Date(),
    });
    return res.status(200).json({ success: true });
  } catch (e) {
    return console.log(e)
  }
};
exports.getTarget = async (req, res) => {
  try {
    const target = await Target.query().select("*");
    return res.status(200).json({ success: true, target });
  } catch (e) {
    console.log(e);
  }
};
exports.getById = async (req, res) => {
  try {
    const lead = await Lead.query().where("id", req.params.id);
    const interest = await LeadInterested.query().where(
      "lead_id",
      req.params.id
    );

    return res.status(200).json({ success: true, lead, interest });
  } catch (e) {
    return res.status(400).json({ success: false, msg: e });
  }
};

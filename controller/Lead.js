const Lead = require("../models/leads");
const LeadInterested = require('../models/lead_interested');

exports.create = async (req, res) => {
  try {
    await Lead.query().create(req.body);
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(400).json({ success: false, msg: e });
  }
};
exports.getById = async (req, res) => {
  try {
    const lead = await Lead.query().where('id',req.params.id)
    const interest = await LeadInterested.query().where('lead_id', req.params.id)

    return res.status(200).json({success: true, lead, interest})
  } catch (e) {
    return res.status(400).json({ success: false, msg: e });
  }
};

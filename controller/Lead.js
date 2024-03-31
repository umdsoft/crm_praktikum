const Lead = require("../models/leads");
const LeadInterested = require("../models/lead_interested");
const Target = require("../models/target");
const NewLead = require("../models/NewLead");
const LeadAction = require("../models/lead_action");
exports.create = async (req, res) => {
  try {
    await Lead.query()
      .insert({
        name: req.body.full_name,
        phone: req.body.phone,
      })
      .then(async (lead) => {
        await NewLead.query().insert({
          lead_id: lead.id,
          target_id: req.body.target,
          edit_date: new Date(),
          edit_time: new Date(),
        });
      });

    return res.status(200).json({ success: true });
  } catch (e) {
    return console.log(e);
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
    const lead = await Lead.query().where("id", req.params.id).first();
    // const interest = await LeadInterested.query().where(
    //   "lead_id",
    //   req.params.id
    // ).first();

    return res.status(200).json({ success: true, lead });
  } catch (e) {
    return res.status(400).json({ success: false, msg: e });
  }
};

exports.getByNew = async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const skip = (req.query.page - 1) * limit || 0;
    const action = req.query.action || 0;
    const leads = await NewLead.knex().raw(`
    SELECT nl.id,nl.created,nl.time,l.name,l.id as uid,l.phone,t.name as target FROM new_lead nl 
    left join leads l on nl.lead_id = l.id
    left join target t on nl.target_id = t.id
    WHERE nl.action = ${action}
    ORDER BY nl.id DESC
    limit ${limit}
    OFFSET ${skip};
    `);
    return res
      .status(200)
      .json({ success: true, leads: leads[0], total: leads[0].length, limit });
  } catch (e) {
    console.log(e);
  }
};

exports.editAction = async (req, res) => {
  try {
    const newLead = await NewLead.query().findById(req.params.id);
    await NewLead.query().patchAndFetchById(req.params.id, {
      action: req.body.action,
      edit_date: new Date(),
      edit_time: new Date(),
    });
    await LeadAction.query().insert({
      lead_id: req.params.id,
      to: newLead.to,
      do: req.body.action
    });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};

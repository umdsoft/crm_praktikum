const Lead = require("../models/leads");
const LeadInterested = require("../models/lead_interested");
const Target = require("../models/target");
const NewLead = require("../models/NewLead");
const LeadAction = require("../models/lead_action");
const sql = require("../setting/mDb");
const jwt = require("jsonwebtoken");
const Reklama = require("../models/reklama");
const LeadTask = require("../models/lead_task");
const Direction = require("../models/Direction");

exports.create = async (req, res) => {
  try {
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);
    const old_lead = await Lead.query().where("phone", req.body.phone).first();
    if (old_lead) {
      await NewLead.query()
        .insert({
          lead_id: old_lead.id,
          target_id: req.body.target,
          edit_date: new Date(),
          edit_time: new Date(),
          direction_id: req.body.direction,
        })
        .then(async (newLead) => {
          await LeadAction.query().insert({
            lead_id: newLead.id,
            to: 0,
            do: 0,
            user_id: candidate.user_id,
          });
        });
      return res.status(200).json({ success: true });
    }
    await Lead.query()
      .insert({
        name: req.body.full_name,
        phone: req.body.phone,
      })
      .then(async (lead) => {
        await NewLead.query()
          .insert({
            lead_id: lead.id,
            target_id: req.body.target,
            edit_date: new Date(),
            edit_time: new Date(),
            direction_id: req.body.direction,
          })
          .then(async (newLead) => {
            await LeadAction.query().insert({
              lead_id: newLead.id,
              to: 0,
              do: 0,
              user_id: candidate.user_id,
            });
          });
      });

    return res.status(200).json({ success: true });
  } catch (e) {
    return console.log(e);
  }
};
exports.createOnline = async (req, res) => {
  try {
    const old_lead = await Lead.query().where("phone", req.body.phone).first();
    if (old_lead) {
      await NewLead.query()
        .insert({
          lead_id: old_lead.id,
          target_id: req.body.target,
          edit_date: new Date(),
          edit_time: new Date(),
          direction_id: 8,
        })
        .then(async (newLead) => {
          await LeadAction.query().insert({
            lead_id: newLead.id,
            to: 0,
            do: 0,
          });
        });
      return res.status(200).json({ success: true });
    }
    await Lead.query()
      .insert({
        name: req.body.full_name,
        phone: req.body.phone,
      })
      .then(async (lead) => {
        await NewLead.query()
          .insert({
            lead_id: lead.id,
            target_id: 8,
            edit_date: new Date(),
            edit_time: new Date(),
            direction_id: 8,
          })
          .then(async (newLead) => {
            await LeadAction.query().insert({
              lead_id: newLead.id,
              to: 0,
              do: 0,
              user_id: 1,
            });
          });
      });

    return res.status(200).json({ success: true });
  } catch (e) {
    return console.log(e);
  }
};
exports.register = async (req, res) => {
  try {
    const old_lead = await Lead.query().where("phone", req.body.phone).first();
    let ads = await Reklama.query().where("utm_id", req.body.target).first();
    if (!ads) {
      ads.target_id = null;
      ads.reklama_id = null;
    }
    if (old_lead) {
      await NewLead.query()
        .insert({
          lead_id: old_lead.id,
          target_id: ads.target_id,
          reklama_id: ads.id,
          edit_date: new Date(),
          edit_time: new Date(),
        })
        .then(async (newLead) => {
          await LeadAction.query().insert({
            lead_id: newLead.id,
            to: 0,
            do: 0,
          });
        });
      return res.status(200).json({ success: true });
    }
    await Lead.query()
      .insert({
        name: req.body.name,
        phone: req.body.phone,
      })
      .then(async (lead) => {
        await NewLead.query()
          .insert({
            lead_id: lead.id,
            target_id: ads.target_id,
            reklama_id: ads.id,
            edit_date: new Date(),
            edit_time: new Date(),
          })
          .then(async (newLead) => {
            await LeadAction.query().insert({
              lead_id: newLead.id,
              to: 0,
              do: 0,
            });
          });
      });

    return res.status(200).json({ success: true });
  } catch (e) {
    return console.log(e);
  }
};
exports.createSite = async (req, res) => {
  try {
    const reklama = await Reklama.query()
      .where("utm_id", req.body.utm_id)
      .first();
    const old_lead = await Lead.query().where("phone", req.body.phone).first();
    if (old_lead) {
      await NewLead.query()
        .insert({
          lead_id: old_lead.id,
          target_id: reklama.target_id,
          edit_date: new Date(),
          edit_time: new Date(),
          reklama_id: reklama.id,
        })
        .then(async (newLead) => {
          await LeadAction.query().insert({
            lead_id: newLead.id,
            to: 0,
            do: 0,
          });
        });
      return res.status(200).json({ success: true });
    }
    await Lead.query()
      .insert({
        name: req.body.full_name,
        phone: req.body.phone,
      })
      .then(async (lead) => {
        await NewLead.query()
          .insert({
            lead_id: lead.id,
            target_id: reklama.target_id,
            edit_date: new Date(),
            edit_time: new Date(),
            reklama_id: reklama.id,
          })
          .then(async (newLead) => {
            await LeadAction.query().insert({
              lead_id: newLead.id,
              to: 0,
              do: 0,
            });
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
    const direction = await Direction.query().select("*");
    return res.status(200).json({ success: true, target, direction });
  } catch (e) {
    console.log(e);
  }
};
exports.getById = async (req, res) => {
  try {
    const lead = await Lead.query().where("id", req.params.id).first();
    const newLead = await NewLead.query()
      .where("lead_id", lead.id)
      .orderBy("id", "desc")
      .first();
    const actions = await LeadAction.query()
      .alias("la") // LeadAction uchun alias belgilash
      .join("user AS u", "la.user_id", "u.id") // `user` jadvali bilan join qilish
      .select("la.*", "u.name AS user_name") // Tanlangan ustunlar
      .where("la.lead_id", newLead.id) // `lead_id` ustuni `newLead.id` ga
      .orderBy("la.id", "desc"); // ID bo‘yicha tartiblash

    return res.status(200).json({
      success: true,
      lead,
      newLead: newLead.id,
      action: newLead.action,
      actions: actions,
    });
  } catch (e) {
    console.log(e);
  }
};

exports.getByNew = async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const skip = (req.query.page - 1) * limit || 0;
    const action = req.query.action || 0;
    const leads = await NewLead.knex().raw(`
    SELECT nl.id,nl.created,nl.time,l.name,l.id as uid,l.phone,t.name as target,t.id as tid,d.name_org as direction  FROM new_lead nl 
    left join leads l on nl.lead_id = l.id
    left join target t on nl.target_id = t.id
    left join direction d on nl.direction_id = d.id
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
    NewLead.query()
      .findById(req.params.id)
      .update({
        action: req.body.action,
        edit_date: new Date(),
        edit_time: new Date(),
      })
      .then(async (lead) => {
        const actions = await LeadAction.query()
          .where("lead_id", req.params.id)
          .first();
        await LeadAction.query().insert({
          lead_id: req.params.id,
          to: actions.do,
          do: req.body.action,
        });
        return res.status(200).json({ success: true });
      })
      .catch((e) => {
        return console.log(e);
      });
  } catch (e) {
    console.log(e);
  }
};

exports.getInterested = async (req, res) => {
  try {
    const interests = await LeadInterested.query()
      .select("*")
      .where("lead_id", req.params.lead_id);
    return res.status(200).json({ success: true, interests });
  } catch (error) {
    console.log(error);
  }
};

exports.postInterested = async (req, res) => {
  try {
    const exist = await LeadInterested.query()
      .where("interest", req.body.interest)
      .first();

    if (exist) {
      return res.status(400).json({ success: false, msg: "exist" });
    }

    const interest = await LeadInterested.query().insert({
      lead_id: req.body.lead_id,
      interest: req.body.interest,
    });

    return res.status(200).json({ success: true, interest });
  } catch (error) {
    console.log(error);
  }
};
exports.editKanban = async (req, res) => {
  try {
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);
    const lead = await NewLead.query().findById(req.params.id);
    await LeadAction.query().insert({
      lead_id: req.params.id,
      to: lead.action,
      do: req.body.action,
      type: 1,
      user_id: candidate.user_id,
    });
    await lead.$query().update(req.body);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};
exports.createAction = async (req, res) => {
  try {
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);
    await LeadAction.query().insert({
      lead_id: req.params.id,
      user_id: candidate.user_id,
      type: 2,
      text: req.body.text,
    });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};
exports.editLead = async (req, res) => {
  try {
    const lead = await Lead.query().findById(req.params.id);
    await lead.$query().update(req.body);
    return res.status(200).json({ success: true });
    // console.log(req.body)
  } catch (e) {
    console.log(e);
  }
};

exports.createTaskLead = async (req, res) => {
  try {
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);

    await LeadTask.query().insert({
      lead_id: req.body.lead_id,
      task: req.body.task,
      user_id: candidate.user_id,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error occurred:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

exports.getTasksLead = async (req, res) => {
  try {
    const data = await sql("lead_task")
      .select(
        "lead_task.*",
        "user.id as user_id",
        "user.name as user_name",
        "user.role as user_role"
      )
      .where("lead_id", req.params.lead_id)
      .leftJoin("user", "lead_task.user_id", "user.id");

    console.log(data);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.log(error);
  }
};

exports.getCandidate = async (req, res) => {
  try {
    const candidates = await NewLead.query()
    .select("new_lead.*", "leads.*", "direction.name_org")
    .leftJoin("leads", "new_lead.lead_id", "leads.id")
    .leftJoin("direction", "new_lead.direction_id", "direction.id")
    .where('new_lead.action', 2).orWhere('new_lead.action', 3)
    return res.status(200).json({ success: true, candidates });
  } catch (error) {
    console.log(error);
  }
};

const Direction = require("../models/Direction");
const Group = require("../models/Group");
const Room = require("../models/Room");
const Day = require("../models/Day");
const Time = require("../models/Time");
const Student = require("../models/Student");
const GroupStudent = require("../models/GroupStudent");
const GrupStudentPay = require("../models/GroupStudentPay");
const SocialStatus = require("../models/SocialStatus");
const Project = require("../models/Project");
exports.create = async (req, res) => {
  try {
    const direction = await Direction.query()
      .where("id", req.body.direction_id)
      .first();
    const lastDate = await Group.query()
      .select("id")
      .orderBy("id", "desc")
      .first();
    //generate ID Number for student
    const idsss = lastDate ? [`${lastDate.id + 1}`] : [1];
    const code = `${direction.code}-${idsss}`;
    await Group.query().insert({
      direction_id: req.body.direction_id,
      status: 0, // 0 - yangi guruh, 1-jarayondagi guruh, 2-tugallagan guruh, 3-o'chirilgan guruh
      day: req.body.day,
      room_id: req.body.room_id,
      time: req.body.time,
      start_date: req.body.start_date,
      duration: req.body.duration,
      code,
    });
    return res.status(201).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};
exports.getDate = async (req, res) => {
  try {
    const direction = await Direction.query().select("*");
    const room = await Room.query().select("*");
    const day = await Day.query().select("*");
    const time = await Time.query().select("*");
    return res.status(200).json({ success: true, direction, room, day, time });
  } catch (e) {
    console.log(e);
  }
};
exports.getAllGroup = async (req, res) => {
  try {
    const limit = req.query.limit || 15;
    const skip = (req.query.page - 1) * limit;
    let allGroup;
    const knex = await Group.knex();
    if (req.query.search) {
      allGroup = await Group.query()
        .where("code", "like", `%${req.query.search}%`)
        .select("*")
        .orderBy("id", "desc")
        .limit(limit)
        .offset(skip);
    } else {
      allGroup = await knex.raw(`
        SELECT
        g.id AS id,
        g.code AS code,
        g.created AS created,
        g.status AS status,
        direc.name AS direction_name,
        day.name AS day,
        rom.name AS room,
        g.start_date,
        time.name AS time ,
        (SELECT count(*) from group_student gs WHERE gs.group_id = g.id) as student_count
    FROM
        groups g 
    LEFT JOIN
        direction direc 
            ON direc.id = g.direction_id 
    LEFT JOIN
        lesson_day day 
            ON day.id = g.day 
    LEFT JOIN
        room rom 
            ON rom.id = g.room_id 
    LEFT JOIN
        lesson_time time 
            ON time.id = g.time 
    ORDER BY g.status
        `);
    }
    return res.status(200).json({
      success: true,
      data: allGroup[0],
      total: allGroup[0].length,
      limit: limit,
    });
  } catch (e) {
    console.log(e);
  }
};

exports.createGroupStudent = async (req, res) => {
  try {
    const group = await Group.query().where("id", req.body.group_id).first();
    const lastDate = await GroupStudent.query()
      .select("id")
      .orderBy("id", "desc")
      .first();
    const idsss = lastDate ? [`${lastDate.id + 1}`] : [1];
    const contract_number = `${group.code}/${idsss}`;
    await GroupStudent.query().insert({
      student_id: req.body.student_id,
      group_id: req.body.group_id,
      contract: contract_number,
      status: 0,
      project_id: req.body.project_id,
      amount: req.body.amount,
      social_status_id: req.body.social_status_id,
    });
    return res.status(201).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};

exports.startGroup = async (req, res) => {
  try {
    const group = await Group.query().where("id", req.body.group_id).first();
    const groupUsers = await GroupStudent.query().orderBy("id", "desc");
    groupUsers.forEach(async (item) => {
      for (let i = 0; i < group.duration; i++) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 5);
        currentDate.setMonth(currentDate.getMonth() + i);
        await GrupStudentPay.query().insert({
          gs_id: item.id,
          amount: item.amount,
          status: 0,
          group_id: item.group_id,
          payment_date: currentDate,
          student_id: item.student_id,
        });
      }
      await GroupStudent.query().where("id", item.id).update({ status: 1 });
    });
    await Group.query().where("id", req.body.group_id).update({
      status: 1,
      main_mentor: req.body.main_mentor,
      second_mentor: req.body.second_mentor,
      english_mentor: req.body.english_mentor,
    });
    return res.status(200).json({ succes: true });
  } catch (e) {
    console.log(e);
  }
};
exports.getOneCourseData = async (req, res) => {
  try {
    const group = await Group.query().where("id", req.params.id).first();
    const groupStudents = await GroupStudent.knex()
      .raw(`SELECT gs.id,s.full_name, s.phone,gs.contract, p.name as project,gs.status,s.code
    FROM group_student gs
    LEFT JOIN student as s on gs.student_id = s.id
    left join project as p on gs.project_id = p.id
    WHERE gs.group_id = ${req.params.id};`);

    const payment = await GrupStudentPay.knex().raw(`
    SELECT gsp.id, s.full_name,gsp.payment_date,gsp.amount, 
    (SELECT SUM(ggsp.amount) as fulls_pay FROM group_student_pay ggsp where ggsp.gs_id = gsp.gs_id) as full_pay,
    (SELECT SUM(ggsp.amount) as qarzs FROM group_student_pay ggsp where ggsp.gs_id = gsp.gs_id and YEAR(ggsp.payment_date) <= YEAR(CURRENT_DATE()) and MONTH(ggsp.payment_date) <= MONTH(CURRENT_DATE())) as qarz
    FROM group_student_pay gsp
    left join student s on gsp.student_id = s.id
    WHERE gsp.group_id = ${req.params.id} and YEAR(gsp.payment_date) = YEAR(CURRENT_DATE()) and MONTH(gsp.payment_date) = MONTH(CURRENT_DATE());
      `);
    return res.status(200).json({
      success: true,
      group,
      groupStudents: groupStudents[0],
      payment: payment[0],
    });
  } catch (e) {
    console.log(e);
  }
};
exports.getServices = async (req, res) => {
  try {
    const social_status = await SocialStatus.query()
      .select("*")
      .orderBy("id", "desc");
    const project = await Project.query().select("*");
    const data = [social_status, project];
    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.log(e);
  }
};
exports.checkStudent = async (req, res) => {
  try {
    const student = await Student.query().where("code", req.params.id).first();
    const groupStudent = await GroupStudent.query()
      .where("student_id", student.id)
      .first();
    if (groupStudent) {
      return res
        .status(200)
        .json({ success: false, message: "Bu talaba guruhda mavjud" });
    }
    if (!student) {
      return res
        .status(200)
        .json({ success: false, message: "Talaba topilmadi" });
    }
    return res.status(200).json({ success: true, student });
  } catch (e) {
    console.log(e);
  }
};

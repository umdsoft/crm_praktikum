const Direction = require("../models/Direction");
const Group = require("../models/Group");
const Room = require("../models/Room");
const Day = require("../models/Day");
const Time = require("../models/Time");
const Student = require("../models/Student");
const GroupStudent = require("../models/GroupStudent");
const GroupStudentPay = require("../models/GroupStudentPay");
const SocialStatus = require("../models/SocialStatus");
const Project = require("../models/Project");
const Users = require("../models/User");
const sql = require("../setting/mDb");
const jwt = require("jsonwebtoken");
const GroupLesson = require("../models/GroupLesson");
const StudentCheck = require("../models/StudentCheck");
const { generateUUID } = require("../setting/randomString");
// const generateUniqueRandomNumber = require('../setting/generatePayCode')

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
      // start_date: req.body.start_date,
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
    const teacher = await Users.query().where("role", 8).select("id", "name");
    return res
      .status(200)
      .json({ success: true, direction, room, day, time, teacher });
  } catch (e) {
    console.log(e);
  }
};

exports.deleteStudentGroup = async (req, res) => {
  try {
  } catch (e) {
    console.log(e);
  }
};
exports.getAllGroup = async (req, res) => {
  try {
    const limit = req.query.limit || 15;
    const skip = req.query.skip;
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);
    const user = await Users.query().where("id", candidate.user_id).first();
    let groupsCountQuery = sql("groups"); // Initialize the groups count query
    const groupsCount = await groupsCountQuery.count("id as count").first(); // Calculate the count based on the condition
    let groups
    if(user.role == '8'){
      groups = await sql("groups")
      .select(
        "groups.id as id",
        "groups.created as created",
        "groups.code as code",
        "groups.status as status",
        "groups.duration as duration",
        "groups.main_mentor as main_mentor_id",
        "groups.start_date as start_date",
        sql.raw("COUNT(group_student.id) as student_count"), // Count the number of students for each group
        "direction.name as direction_name",
        "lesson_day.name as day",
        "room.name as room",
        "lesson_time.name as time"
      )      
      .leftJoin("direction", "groups.direction_id", "direction.id")
      .leftJoin("group_student", "groups.id", "group_student.group_id") // Join on the group_id
      .leftJoin("lesson_day", "groups.day", "lesson_day.id") // Join on the group_id
      .leftJoin("room", "groups.room_id", "room.id")
      .leftJoin("lesson_time", "groups.time", "lesson_time.id")
      .groupBy("groups.id") // Group by group id to get the count of students for each group
      .where("groups.main_mentor", user.id)
      .limit(limit)
      .offset(skip)
      .orderBy("status", "asc");

    } else {
      groups = await sql("groups")
      .select(
        "groups.id as id",
        "groups.created as created",
        "groups.code as code",
        "groups.status as status",
        "groups.duration as duration",
        "groups.main_mentor as main_mentor_id",
        "groups.start_date as start_date",
        sql.raw("COUNT(group_student.id) as student_count"), // Count the number of students for each group
        "direction.name as direction_name",
        "lesson_day.name as day",
        "room.name as room",
        "lesson_time.name as time"
      )
      .leftJoin("direction", "groups.direction_id", "direction.id")
      .leftJoin("group_student", "groups.id", "group_student.group_id") // Join on the group_id
      .leftJoin("lesson_day", "groups.day", "lesson_day.id") // Join on the group_id
      .leftJoin("room", "groups.room_id", "room.id")
      .leftJoin("lesson_time", "groups.time", "lesson_time.id")
      .groupBy("groups.id") // Group by group id to get the count of students for each group
      .limit(limit)
      .offset(skip)
      .orderBy("status", "asc");
    }
    return res.status(200).json({
      success: true,
      limit: limit,
      total: groupsCount.count,
      data: groups,
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

    if (group.status === 1) {
      const con = await GroupStudent.query()
        .where("student_id", req.body.student_id)
        .andWhere("group_id", req.body.group_id)
        .first();
      if (con) {
        return res.status(200).json({ success: false, msg: "user-bor" });
      }
      let repush = [];

      const start_month = new Date(group.start_date);
      const now_month = new Date(req.body.join_date);

      if (now_month < start_month) {
        return res
          .status(400)
          .json({ success: false, msg: "join", text: `${group.start_date}` });
      }

      const rezonans = now_month.getMonth() - start_month.getMonth();

      for (let i = 0; i < group.duration - rezonans; i++) {
        repush.push(i);
      }
      const gs = await GroupStudent.query().insert({
        student_id: req.body.student_id,
        group_id: req.body.group_id,
        contract: contract_number,
        status: 0,
        project_id: req.body.project_id,
        amount: req.body.amount,
        social_status_id: req.body.social_status_id,
      });

      repush.forEach(async (item) => {
        const currentDate = new Date(req.body.join_date);
        currentDate.setDate(currentDate.getDate() + 5);
        currentDate.setMonth(currentDate.getMonth() + item);

        await GroupStudentPay.query().insert({
          gs_id: gs.id,
          amount: req.body.amount,
          status: 0,
          group_id: group.id,
          payment_date: currentDate,
          student_id: gs.student_id,
        });
      });
    } else if (group.status === 0) {
      const con = await GroupStudent.query()
        .where("student_id", req.body.student_id)
        .andWhere("group_id", req.body.group_id)
        .first();
      if (!con) {
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
      } else {
        return res.status(200).json({ success: false, msg: "user-bor" });
      }
    }
    return res.status(201).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};

exports.startGroup = async (req, res) => {
  try {
    const group = await Group.query().findOne("id", req.body.group_id);
    const startDate = new Date(req.body.start_date);
    if (!group) {
      return res
        .status(400)
        .json({ success: false, message: "Group not found" });
    }
    if (group.status == 1) {
      return res.status(200).json({ success: false, msg: "group-stared" });
    }
    if (!group.duration) {
      return res.status(200).json({ success: false, message: "duration-null" });
    }
    const groupUsers = await GroupStudent.query()
      .where("group_id", group.id)
      .orderBy("id", "desc");
    groupUsers.forEach(async (item) => {
      for (let i = 0; i < group.duration; i++) {
        const currentDate = new Date(req.body.start_date);
        const code = Math.floor(100000 + Math.random() * 900000);
        currentDate.setDate(currentDate.getDate() + 5);
        currentDate.setMonth(currentDate.getMonth() + i);
        await GroupStudentPay.query().insert({
          gs_id: item.id,
          amount: item.amount,
          code,
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
      main_mentor: req.body.mentor,
      start_date: startDate,
    });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};
exports.endGroup = async (req, res) => {
  try {
    await Group.query().where("id", req.params.id).update({ status: 2 });
    const gsp = await GroupStudent.query().where("group_id", req.params.id);
    gsp.forEach(async (item) => {
      await GroupStudent.query().where("id", item.id).update({
        status: 3,
        cert_code: generateUUID(),
        cert_date: new Date(),
      });
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};
exports.getOneCourseData = async (req, res) => {
  try {
    const lessonGroup = await GroupLesson.query()
      .where("group_id", req.params.id)
      .andWhere("lesson_status", 0)
      .first();
    const group = await Group.query()
      .select(
        "groups.id as id",
        "direction.name as name",
        "groups.code",
        "groups.status"
      )
      .leftJoin("direction", "groups.direction_id", "direction.id")
      .where("groups.id", req.params.id)
      .first();

    const countGroupStudent = await GroupStudent.query()
      .where("group_id", req.params.id)
      .count("* as count");

    const groupStudents = await sql("group_student")
      .select(
        "student.id as student_id",
        "student.code as student_code",
        "group_student.contract as contract",
        "project.name as project",
        "group_student.status as status",
        "group_student.id as gid",
        "student.*",
        "group_student.cert_code"
      )
      .leftJoin("student", "group_student.student_id", "student.id")
      .leftJoin("project", "group_student.project_id", "project.id")
      .where("group_student.group_id", req.params.id);

    const payment = await GroupStudentPay.knex().raw(`
    SELECT gsp.id, s.full_name,gsp.payment_date,gsp.amount,  gsp.student_id as student_id,
    (SELECT SUM(ggsp.amount) as fulls_pay FROM group_student_pay ggsp where ggsp.gs_id = gsp.gs_id) as full_pay,
    (SELECT SUM(ggsp.amount) as qarzs FROM group_student_pay ggsp where ggsp.gs_id = gsp.gs_id and YEAR(ggsp.payment_date) <= YEAR(CURRENT_DATE()) and MONTH(ggsp.payment_date) <= MONTH(CURRENT_DATE())) as qarz
    FROM group_student_pay gsp
    left join student s on gsp.student_id = s.id
    WHERE gsp.group_id = ${req.params.id} and YEAR(gsp.payment_date) = YEAR(CURRENT_DATE()) and MONTH(gsp.payment_date) = MONTH(CURRENT_DATE());
      `);
    const checkData = await StudentCheck.knex().raw(`
          SELECT 
      group_id, 
      DATE_FORMAT(created, '%d.%m.%Y') as created
  FROM 
      group_student_checkup
  WHERE 
      group_id = ${req.params.id}
  GROUP BY 
      created
  ORDER BY 
      created;
        `);
    const [rows] = await StudentCheck.knex().raw(
      ` SELECT 
          a.student_id,
          s.full_name,
          DATE_FORMAT(a.created, '%d.%m.%Y') AS date,
          a.status AS checkup
      FROM 
          group_student_checkup AS a
      JOIN 
          student AS s ON a.student_id = s.id
      WHERE 
          a.group_id = ${req.params.id}
      ORDER BY 
          a.student_id, a.created;
      `
    );

    // Ma'lumotlarni guruhlash
    // JSON formatga moslash
    const groupedData = rows.reduce((acc, row) => {
      // O'quvchini topish
      let student = acc.find((item) => item.student_id === row.student_id);

      if (!student) {
        student = {
          student_id: row.student_id,
          full_name: row.full_name,
          data: [],
        };
        acc.push(student);
      }

      // `data` massiviga sana va checkup qo'shish
      student.data.push({
        date: row.date,
        checkup: row.checkup,
      });

      return acc;
    }, []);

    //  and YEAR(gsp.payment_date) = YEAR(CURRENT_DATE()) and MONTH(gsp.payment_date) = MONTH(CURRENT_DATE())
    return res.status(200).json({
      success: true,
      group,
      countGroupStudent,
      groupStudents: groupStudents,
      payment: payment[0],
      lessonGroup: lessonGroup,
      checkData:checkData[0],
      formattedData: groupedData,
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
    const student = await Student.query()
      .where("code", req.body.student_code)
      .first();
    const group = await Group.query().where("id", req.body.group_id).first();

    if (!student) {
      return res.status(200).json({ success: false, message: 1 });
    }

    if (!group) {
      return res.status(200).json({ success: false, message: 0 });
    }

    const groupStudent = await GroupStudent.query()
      .where("group_id", group.id)
      .where("student_id", student.id)
      .first();

    if (groupStudent) {
      return res.status(200).json({ success: false, message: 2 });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};

exports.getAllMentor = async (req, res) => {
  try {
    const mentor = await Users.query().where("role", 8).select("id", "name");
    return res.status(200).json({ success: true, data: mentor });
  } catch (e) {
    console.log(e);
  }
};

exports.getGroupUserContractData = async (req, res) => {
  try {
    const { student_id } = req.query;

    if (!student_id) {
      return res
        .status(400)
        .json({ success: false, message: "Student ID not found" });
    }

    const groupStudentPay = await sql("group_student_pay")
      .select()
      .where("student_id", student_id)
      .where("group_id", req.params.id)
      .first();

    const groupStudentData = await sql("group_student")
      .select(
        "group_student.id as group_student_id",
        "group_student.*",
        "group_student.status as amount_status",
        "groups.id as group_id",
        "group_student.created as group_student_created",
        "groups.created as group_created",
        "groups.*",
        "student.id as student_id",
        "student.code as student_code",
        "student.*"
      )
      .leftJoin("groups", "group_student.group_id", "groups.id")
      .leftJoin("student", "group_student.student_id", "student.id")
      .where("group_student.group_id", req.params.id)
      .where("group_student.student_id", student_id)
      .first();

    if (!groupStudentData) {
      return res
        .status(400)
        .json({ success: false, message: "Group Student not found" });
    }
    if (!groupStudentData.direction_id) {
      return res
        .status(400)
        .json({ success: false, message: "Direction not found" });
    }

    const direction = await sql("direction")
      .where("id", groupStudentData.direction_id)
      .first();

    const data = {
      group_id: groupStudentData.group_id,
      contract: groupStudentData.contract,
      status: groupStudentData.status,
      group_student_created: groupStudentData.group_student_created,
      duration: groupStudentData.duration,
      group_created: groupStudentData.group_created,
      amount: groupStudentData.amount,
      amount_status: groupStudentData.amount_status,
      start_date: groupStudentData.start_date,
      direction,
      student: {
        id: groupStudentData.student_id,
        code: groupStudentData.student_code,
        full_name: groupStudentData.full_name,
        phone: groupStudentData.phone,
        brightday: groupStudentData.brightday,
      },
      group_student_pay: groupStudentPay,
    };

    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.log(e);
  }
};

exports.getGroupStudents = async (req, res) => {
  try {
    const groupStudents = await sql("group_student")
      .select(
        "group_student.id as group_student_id",
        "group_student.*",
        "group_student.status as amount_status",
        "group_student.created as group_student_created",
        "student.id as student_id",
        "student.code as student_code",
        "student.*"
      )
      .leftJoin("student", "group_student.student_id", "student.id")
      .where("group_student.group_id", req.params.id)
      .orderBy("group_student_id", "desc");

    return res.status(200).json({ success: true, data: groupStudents });
  } catch (e) {
    console.log(e);
  }
};

exports.postCheckStudent = async (req, res) => {
  try {
    
    const data = req.body.data;
    data.forEach(async (item) => {
      try {
        await StudentCheck.query().insert({
          student_id: item.student_id,
          group_id: item.group_id,
          status: item.isCheck ? 1 : 0,
          reason: item.reason,
          created: new Date(),
          gs_id: item.gsid,
          gl_id: item.gl_id,
        });
      } catch (error) {
        console.log(error);
      }
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};

exports.getCheckUpGroup = async (req, res) => {
  try {
    const checkup = await sql("group_student_checkup")
      .select(
        "group_student_checkup.*",
        "student.id as student_id",
        "student.code as student_code",
        "student.full_name as student_full_name"
      )
      .leftJoin("student", "group_student_checkup.student_id", "student.id")
      .where("group_id", req.params.id);

    const groupedCheckup = {};
    checkup.forEach((check) => {
      const createdDate = check.created.toISOString().split("T")[0];
      if (!groupedCheckup[createdDate]) {
        groupedCheckup[createdDate] = [];
      }
      groupedCheckup[createdDate].push(check);
    });

    const groupedCheckupArray = Object.entries(groupedCheckup).map(
      ([created, data]) => ({
        created,
        data,
      })
    );

    return res.status(200).json({ success: true, data: groupedCheckupArray });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

exports.getGroupStudentsPays = async (req, res) => {
  try {
    const { group_id } = req.params; // 0, 1, 2, 3, ...
    const { month } = req.query;

    if (!group_id)
      return res.status(400).json({ success: false, msg: "group_id invalid" });

    const group = await Group.query().select("*").where("id", group_id).first();
    if (!group)
      return res.status(400).json({ success: false, msg: "Not found group!" });

    let months = [];
    const cd = new Date();

    for (let i = 0; i < group.duration; i++) {
      const currentDate = new Date(group.start_date);
      currentDate.setMonth(currentDate.getMonth() + i);
      months.push(currentDate.getMonth() + 1);
    }

    months.sort((a, b) => {
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
      return 0;
    });

    const currentMonth = month || months[0];

    const payment = await GroupStudentPay.knex().raw(`
      SELECT gsp.*, s.full_name, s.phone, gsp.code AS gsp_code, s.code AS student_code
      FROM group_student_pay AS gsp
      INNER JOIN student AS s ON gsp.student_id = s.id
      WHERE gsp.group_id = ${group_id} AND MONTH(gsp.payment_date) = ${currentMonth};
    `);

    res.status(200).json({
      success: true,
      current: cd.getMonth() + 1,
      months,
      data: payment[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

exports.getGroupDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id))
      return res.status(400).json({ success: false, message: "Invalid ID!" });

    const group = await Group.query().select("*").where("id", id).first();

    return res.status(200).json({ success: true, data: group });
  } catch (error) {
    console.log(error);
  }
};

exports.changeStatus = async (req, res) => {
  try {
    const { group_id } = req.params;
    const { status } = req.body;
    if (Number(isNaN(group_id)))
      return res.status(400).json({ message: "Invalid group_id!" });
    if (Number(isNaN(status)))
      return res.status(400).json({ message: "Invalid status! Only number!" });
    if (Number(status) !== 2)
      return res.status(400).json({
        message: "Hozircha faqat guruhni tugatish funksiyasi ishlaydi!",
      });

    const group = await Group.query().where("id", group_id).first();
    if (!group) return res.status(400).json({ message: "Guruh topilmadi!" });

    const todayDate = new Date();
    let current = new Date(group.start_date);
    current.setMonth(current.getMonth() + group.duration);

    if (current >= todayDate)
      return res.status(400).json({ message: "Hali tugata olmaysiz!" });

    const updated = await Group.query()
      .where("id", group_id)
      .update({ status: status });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.log(error);
  }
};

exports.startLesson = async (req, res) => {
  try {
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);

    const lessonGroup = await GroupLesson.query()
      .where("group_id", req.body.group_id)
      .andWhere("lesson_status", 0)
      .first();
    if (lessonGroup != null) {
      console.log(1);
      return res.status(200).json({ success: false, err: "lesson-started" });
    }

    await GroupLesson.query().insert({
      mentor_id: candidate.user_id,
      group_id: req.body.group_id,
      lesson_start_time: new Date(),
      created: new Date(),
      lesson_status: 0,
    });
    return res.status(201).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};
exports.endLesson = async (req, res) => {
  await GroupLesson.query().where("group_id", req.params.id).update({
    lesson_end_time: new Date(),
    lesson_status: 1,
  });
  return res.status(200).json({ success: true });
};

exports.deleteStudentGroup = async (req, res) => {
  try {
    const con = await GroupStudent.query().findOne("id", req.params.id);
    const group = await Group.query().findOne("id", con.group_id);
    if (group.status == 0) {
      await GroupStudent.query().where("id", req.params.id).delete();
      return res.status(200).json({ success: true });
    }
    await GroupStudent.query().where("id", req.params.id).update({ status: 2 });
    const pays = await GroupStudentPay.query()
      .where("gs_id", req.params.id)
      .andWhere("status", 0);
    pays.forEach(async (item) => {
      if (new Date(item.payment_date) > new Date()) {
        await GroupStudentPay.query()
          .where("id", item.id)
          .update({ status: 2 });
      }
    });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};

exports.getCheckGroupData = async (req, res) => {
  try {
    const data = await GroupLesson.knex().raw(`
  SELECT gl.*, 
       u.name, 
       g.code, 
       d.name AS direction, 
       COUNT(DISTINCT gs.id) AS student_count,
       COUNT(DISTINCT CASE WHEN gsc.status = 1 THEN gsc.gs_id END) AS attended_count,
       COUNT(DISTINCT CASE WHEN gsc.status = 0 THEN gsc.gs_id END) AS not_attended_count
FROM group_lesson gl
LEFT JOIN user u ON gl.mentor_id = u.id
LEFT JOIN groups g ON gl.group_id = g.id
LEFT JOIN direction d ON g.direction_id = d.id
LEFT JOIN group_student gs ON gs.group_id = g.id
LEFT JOIN group_student_checkup gsc ON gsc.gl_id = gl.id AND gsc.gs_id = gs.id
GROUP BY gl.id, u.name, g.code, d.name
ORDER BY gl.lesson_status ASC, gl.id DESC
LIMIT 15 OFFSET 0;
      `);
    return res.status(200).json({ success: true, data: data[0] });
  } catch (e) {
    console.log(e);
  }
};

exports.getOneCheckGroupLesson = async (req, res) => {
  try {
    const data = await GroupLesson.knex().raw(`
      SELECT s.full_name, 
       s.phone, 
       gsc.status ,
       gsc.reason,
       d.name as direction,
       g.code
FROM group_student_checkup gsc
JOIN group_student gs ON gsc.gs_id = gs.id
JOIN student s ON gs.student_id = s.id
LEFT JOIN groups g ON gsc.group_id = g.id
LEFT JOIN direction d ON g.direction_id = d.id
WHERE gsc.gl_id = ${req.params.id};
    `);

    return res.status(200).json({ success: true, data: data[0] });
  } catch (e) {
    console.log(e);
  }
};

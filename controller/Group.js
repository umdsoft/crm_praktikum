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
const User = require("../models/User");
const StudentCheck = require("../models/StudentCheck");

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
    return res.status(200).json({ success: true, direction, room, day, time });
  } catch (e) {
    console.log(e);
  }
}

// let allGroup;
// const knex = await Group.knex();
// if (req.query.search) {
//   allGroup = await Group.query()
//     .where("code", "like", `%${req.query.search}%`)
//     .select("*")
//     .orderBy("id", "desc")
//     .limit(limit)
//     .offset(skip);
// } else {
//   allGroup = await knex.raw(`
//     SELECT
//     g.id AS id,
//     g.code AS code,
//     g.created AS created,
//     g.status AS status,
//     direc.name AS direction_name,
//     day.name AS day,
//     rom.name AS room,
//     g.start_date,
//     time.name AS time ,
//     (SELECT count(*) from group_student gs WHERE gs.group_id = g.id) as student_count
// FROM
//     groups g
// LEFT JOIN
//     direction direc
//         ON direc.id = g.direction_id
// LEFT JOIN
//     lesson_day day
//         ON day.id = g.day
// LEFT JOIN
//     room rom
//         ON rom.id = g.room_id
// LEFT JOIN
//     lesson_time time
//         ON time.id = g.time
// ORDER BY g.status
// LIMIT ${limit} OFFSET ${skip};
//     `);
// }

exports.getAllGroup = async (req, res) => {
  try {
    const limit = req.query.limit || 15;
    const page = req.query.page || 1;
    const skip = (page - 1) * limit;
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);
    const user = await Users.query()
      .where("id", candidate.user_id)
      .first()
      .select("*");

    let groups = [];
    let groupsCountQuery = sql("groups"); // Initialize the groups count query

    if (user.role === 8) {
      groupsCountQuery = groupsCountQuery.where(function () {
        this.where("groups.main_mentor", user.id)
          .orWhere("groups.second_mentor", user.id)
          .orWhere("groups.english_mentor", user.id);
      });
    }

    const groupsCount = await groupsCountQuery.count("id as count").first(); // Calculate the count based on the condition

    if (user.role === 8) {
      groups = await sql("groups")
        .select(
          "groups.id as id",
          "groups.created as created",
          "groups.code as code",
          "groups.status as status",
          "groups.duration as duration",
          "groups.main_mentor as main_mentor_id",
          "groups.second_mentor as second_mentor_id",
          "groups.english_mentor as english_mentor_id",
          "groups.start_date as start_date",
          sql.raw("COUNT(group_student.id) as student_count"), // Count the number of students for each group
          "direction.name as direction_name",
          "lesson_day.name as day",
          "room.name as room",
          "lesson_time.name as time"
        )
        .where(function () {
          this.where("groups.main_mentor", user.id)
            .orWhere("groups.second_mentor", user.id)
            .orWhere("groups.english_mentor", user.id)
            .orWhere(
              "direction.name",
              "like",
              `%${req.query.search?.toLowerCase()}%`
            )
            .orWhere(
              "groups.code",
              "like",
              `%${req.query.search?.toLowerCase()}%`
            );
        })
        .leftJoin("direction", "groups.direction_id", "direction.id")
        .leftJoin("group_student", "groups.id", "group_student.group_id") // Join on the group_id
        .leftJoin("lesson_day", "groups.day", "lesson_day.id") // Join on the group_id
        .leftJoin("room", "groups.room_id", "room.id")
        .leftJoin("lesson_time", "groups.time", "lesson_time.id")
        .groupBy("groups.id") // Group by group id to get the count of students for each group
        .limit(limit)
        .offset(skip)
        .orderBy("id", "desc");
    } else {
      groups = await sql("groups")
        .select(
          "groups.id as id",
          "groups.created as created",
          "groups.code as code",
          "groups.status as status",
          "groups.duration as duration",
          "groups.main_mentor as main_mentor_id",
          "groups.second_mentor as second_mentor_id",
          "groups.english_mentor as english_mentor_id",
          "groups.start_date as start_date",
          sql.raw("COUNT(group_student.id) as student_count"), // Count the number of students for each group
          "direction.name as direction_name",
          "lesson_day.name as day",
          "room.name as room",
          "lesson_time.name as time"
        )
        .where(function () {
          this.where(
            "direction.name",
            "like",
            `%${req.query.search?.toLowerCase()}%`
          ).orWhere(
            "groups.code",
            "like",
            `%${req.query.search?.toLowerCase()}%`
          );
        })
        .leftJoin("direction", "groups.direction_id", "direction.id")
        .leftJoin("group_student", "groups.id", "group_student.group_id") // Join on the group_id
        .leftJoin("lesson_day", "groups.day", "lesson_day.id") // Join on the group_id
        .leftJoin("room", "groups.room_id", "room.id")
        .leftJoin("lesson_time", "groups.time", "lesson_time.id")
        .groupBy("groups.id") // Group by group id to get the count of students for each group
        .limit(limit)
        .offset(skip)
        .orderBy("id", "desc");
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
      .first()

    const idsss = lastDate ? [`${lastDate.id + 1}`] : [1]
    const contract_number = `${group.code}/${idsss}`



    if (group.status === 1) {



      let repush = []

      const start_month = new Date(group.start_date)
      const now_month = new Date(req.body.join_date)

      if (now_month < start_month) {
        return res.status(400).json({ success: false, msg: "join", text: `${group.start_date}` })
      }


      const rezonans = now_month.getMonth() - start_month.getMonth()

      for (let i = 0; i < group.duration - rezonans; i++) {
        repush.push(i)
      }
      const gs = await GroupStudent.query().insert({
        student_id: req.body.student_id,
        group_id: req.body.group_id,
        contract: contract_number,
        status: 0,
        project_id: req.body.project_id,
        amount: req.body.amount,
        social_status_id: req.body.social_status_id
      })

      repush.forEach(async (item) => {
        const currentDate = new Date(req.body.join_date)
        currentDate.setDate(currentDate.getDate() + 5)
        currentDate.setMonth(currentDate.getMonth() + item)

        await GroupStudentPay.query().insert({
          gs_id: gs.id,
          amount: req.body.amount,
          status: 0,
          group_id: group.id,
          payment_date: currentDate,
          student_id: gs.student_id
        })
      })

    } else if (group.status === 0) {
      const gs = await GroupStudent.query().insert({
        student_id: req.body.student_id,
        group_id: req.body.group_id,
        contract: contract_number,
        status: 0,
        project_id: req.body.project_id,
        amount: req.body.amount,
        social_status_id: req.body.social_status_id
      })
    }

    return res.status(201).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};

exports.startGroup = async (req, res) => {
  try {
    const group = await Group.query().where("id", req.body.group_id).first();
    const startDate = new Date(req.body.start_date);

    if (!group) {
      return res
        .status(400)
        .json({ success: false, message: "Group not found" });
    }

    if (!group.duration) {
      return res.status(400).json({ success: false, message: "duration-null" });
    }

    const groupUsers = await GroupStudent.query()
      .where("group_id", group.id)
      .orderBy("id", "desc");

    groupUsers.forEach(async (item) => {
      for (let i = 0; i < group.duration; i++) {
        const currentDate = new Date(req.body.start_date);
        currentDate.setDate(currentDate.getDate() + 5);
        currentDate.setMonth(currentDate.getMonth() + i);
        await GroupStudentPay.query().insert({
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
      start_date: startDate,
    })


    return res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};

exports.getOneCourseData = async (req, res) => {
  try {
    const group = await Group.query().where("id", req.params.id).first();
    const countGroupStudent = await GroupStudent.query()
      .where("group_id", req.params.id)
      .count("* as count");
    // const groupStudents = await GroupStudent.knex()
    //   .raw(`SELECT gs.id,s.full_name, s.phone,gs.contract, p.name as project,gs.status,s.code
    // FROM group_student gs
    // LEFT JOIN student as s on gs.student_id = s.id
    // left join project as p on gs.project_id = p.id
    // WHERE gs.group_id = ${req.params.id};`);

    const groupStudents = await sql("group_student")
      .select(
        "student.id as student_id",
        "student.code as student_code",
        "student.*"
      )
      .leftJoin("student", "group_student.student_id", "student.id")
      .where("group_student.group_id", req.params.id);

    const payment = await GroupStudentPay.knex().raw(`
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
      countGroupStudent,
      groupStudents: groupStudents,
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
    const student = await Student.query().where("code", req.body.student_code).first();
    const group = await Group.query().where("id", req.body.group_id).first()


    if (!student) {
      return res.status(200).json({ success: false, message: 1 });
    }

    if (!group) {
      return res.status(200).json({ success: false, message: 0 })
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
    const mentor = await User.query().where("role", 8).select("id", "name");
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
    const { group_id, data } = req.body;

    if (!group_id) {
      return res
        .status(400)
        .json({ success: false, message: "Group ID not found" });
    }

    if (!data) {
      return res
        .status(400)
        .json({ success: false, message: "Data not found" });
    }

    data.forEach(async (item) => {
      try {
        await StudentCheck.query().insert({
          student_id: item.id,
          group_id: group_id,
          status: item.isCheck ? 1 : 0,
          reason: item.reason,
          created: new Date(),
          gs_id: null,
          gl_id: null,
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

    if (!group_id) return res.status(400).json({ success: false, msg: "group_id invalid" })

    const group = await Group.query().select("*").where("id", group_id).first()
    if (!group) return res.status(400).json({ success: false, msg: "Not found group!" })
    
    let months = []
    const cd = new Date()
    
    for (let i = 0; i < group.duration; i++) {
      const currentDate = new Date(group.start_date)
      currentDate.setMonth(currentDate.getMonth() + i)
      months.push(currentDate.getMonth() + 1)
    }

    months.sort((a, b) => { 
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1; 
        }
        return 0;
    })

    const currentMonth = month || months[0]

    const payment = await GroupStudentPay.knex().raw(`
      SELECT gsp.*, s.full_name, s.phone, gsp.code AS gsp_code, s.code AS student_code
      FROM group_student_pay AS gsp
      INNER JOIN student AS s ON gsp.student_id = s.id
      WHERE gsp.group_id = ${group_id} AND MONTH(gsp.payment_date) = ${currentMonth};
    `);

    res.status(200).json({ success: true, current: cd.getMonth() + 1, months, data: payment[0] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};



exports.getGroupDetails = async(req, res) => {
  try {
    const { id } = req.params

    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid ID!" })

    const group = await Group.query().select("*").where("id", id).first()

    return res.status(200).json({ success: true, data: group })

  } catch (error) {
    console.log(error);
  }
}
const LessonDars = require("../models/LessonDars.js");
const LessonOpen = require("../models/LessonOpen.js");
const Test = require("../models/Test.js");
const sql = require("../setting/mDb.js");
const jwt = require("jsonwebtoken");

exports.getGroups = async (req, res) => {
  try {
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);

    const groups = await sql("group_student")
      .select(
        "group_student.id as id",
        "groups.id as group_id",
        "groups.start_date as start_date",
        "groups.direction_id as direction_id",
        "groups.status as status",
        "groups.code as group_code",
        "groups.duration as duration",
        "lesson_day.name as lesson_day",
        "lesson_time.name as lesson_time",
        "direction.name as direction_name",
        "direction.code as direction_code",
        "user.name as mentor"
      )
      .leftJoin("groups", "group_student.group_id", "groups.id")
      .leftJoin("lesson_day", "groups.day", "lesson_day.id")
      .leftJoin("lesson_time", "groups.time", "lesson_time.id")
      .leftJoin("direction", "groups.direction_id", "direction.id")
      .leftJoin("user", "groups.main_mentor", "user.id")
      .where("student_id", candidate.user_id);

    return res.status(200).json({ success: true, data: groups });
  } catch (e) {
    console.log(e);
  }
};

exports.getMyLessons = async (req, res) => {
  try {
    const group_id = parseInt(req.params.group_id);
    if (isNaN(group_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const group = await sql('groups')
    .select(
      'groups.*',
      'direction.name as direction_name',
    )
    .leftJoin('direction', 'groups.direction_id', 'direction.id')
    .where("groups.id", group_id).first()

    if (!group) {
      return res.status(400).json({
        success: false,
        message: "Group not found",
      });
    }

    const direction_id = group.direction_id
    
    const query = sql("lesson")
    .select(
      "lesson.*",
      sql.raw("COUNT(module.id) AS module_count")
    )
    .leftJoin("lesson_module AS module", "module.lesson_id", "lesson.id")
    .leftJoin("direction", "lesson.direction_id", "direction.id")
    .where("direction.id", direction_id)
    .groupBy("lesson.id", "lesson.name", "direction.name")
    .orderBy("lesson.id", "asc")

    const lessons = await query

    return res.status(200).json({ success: true, data: lessons, group });
  } catch (error) {
    console.log(error);
  }
};



exports.getMyModules = async (req, res) => {
  try {
    const lesson_id = parseInt(req.params.lesson_id);
    if (isNaN(lesson_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const query = sql("lesson_module")
    .select(
      "lesson_module.*",
      sql.raw("COUNT(lesson_dars.id) AS dars_count")
    )
    .leftJoin("lesson_dars", "lesson_module.id", "lesson_dars.module_id")
    .leftJoin("lesson", "lesson_module.lesson_id", "lesson.id")
    .where("lesson_module.lesson_id", lesson_id)
    .groupBy("lesson_module.id")
    .orderBy("lesson_module.id", "asc")

  const modules = await query;


     return res.status(200).json({ success: true, data: modules });
  } catch (error) {
    console.log(error);
  } 
}


exports.getMyLessonDars = async (req, res) => {
  try {
    const group_id = parseInt(req.query.group_id);
    const module_id = parseInt(req.query.module_id);

    if (isNaN(group_id) || isNaN(module_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const lessons = await sql("lesson_dars")
      .select(
        "lesson_dars.id AS id",
        "lesson_dars.name as lesson_name",
        "lesson_dars.description",
        "lesson_dars.created",
        "lesson_dars.module_id",
        "lesson_dars.video_url",
        "lesson_dars.text",
        "lesson_dars.video_duration",
        sql.raw("COALESCE(lesson_open.id, NULL) AS lesson_open_id"),
        "lesson_open.test_status",
      )
      .leftJoin("lesson_open", function() {
        this.on("lesson_dars.id", "=", "lesson_open.lesson_dars_id")
          .on("lesson_open.group_id", "=", group_id);
      })
      .where("lesson_dars.module_id", module_id);

    return res.status(200).json({ success: true, data: lessons });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


exports.getDarsById = async (req, res) => {
  try {

    const dars_id = parseInt(req.params.id)
    const group_id = parseInt(req.query.group_id)

    if (isNaN(dars_id) || isNaN(group_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const openDars = await LessonOpen.query().where("group_id", group_id).where("lesson_dars_id", dars_id).first();


    if (openDars.status === 0) return res.status(400).json({
      success: false,
      message: "block",
    });

    const tests = await Test.query().where("lesson_dars_id", dars_id)

    const dars = await LessonDars.query().findById(dars_id)
    return res
      .status(200)
      .json({ success: true, dars: dars, tests_count: tests.length, test_status: openDars.test_status })

  } catch (error) {
    console.log(error);
  }
};



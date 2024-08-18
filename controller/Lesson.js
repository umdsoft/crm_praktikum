const { default: axios } = require("axios");
const Lesson = require("../models/Lesson");
const LessonDars = require("../models/LessonDars");
const LessonDarsFiles = require("../models/LessonDarsFile.js");
const LessonModule = require("../models/LessonModule");
const sql = require("../setting/mDb.js");
const some = require("../setting/mDb");
const {
  createLDSchema,
  createFileSchema,
  changeStatusDarsSchema,
  changeStatusTestSchema,
} = require("../validators/lesson-validators.js");
const jwt = require("jsonwebtoken");
const Test = require("../models/Test.js");
const User = require("../models/User.js");
const LessonOpen = require("../models/LessonOpen.js");

exports.createLesson = async (req, res) => {
  try {
    await Lesson.query().insert({
      name: req.body.name,
      mentor_id: req.body.mentor_id,
      direction_id: req.body.direction_id,
      lesson_type: 1,
      lesson_status: 1,
    });
    return res.status(201).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};

exports.createLessonModule = async (req, res) => {
  try {
    await LessonModule.query().insert({
      name: req.body.name,
      lesson_id: req.body.lesson_id,
      status: 1,
    });
    return res.status(201).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};
exports.getAllLesson = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 15;
    const skip = (page - 1) * limit;
    const { direction_id } = req.query;
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);
    const mentor_id = candidate.user_id;

    const user = await User.query().findById(mentor_id);
    const total = await some("lesson")
      .count("id as count")
      .first();
    const query = sql("lesson")
      .select(
        "lesson.*",
        "direction.name AS direction_name",
        sql.raw("COUNT(module.id) AS module_count")
      )
      .leftJoin("lesson_module AS module", "module.lesson_id", "lesson.id")
      .leftJoin("direction", "lesson.direction_id", "direction.id")
      .groupBy("lesson.id", "lesson.name", "direction.name")
      .orderBy("lesson.id", "asc")
      .limit(limit)
      .offset(skip);

    // if (user.role === 8) {
    //   query.where("lesson.mentor_id", mentor_id);
    // }

    if (direction_id) {
      query.andWhere("lesson.direction_id", direction_id);
    }

    const lessons = await query;

    return res.status(200).json({ success: true, data: lessons, total: total.count });
  } catch (e) {

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getAllLessonModule = async (req, res) => {
  try {
    const limit = req.query.limit || 15;
    const skip = req.query.skip;
    if (isNaN(parseInt(req.params.id))) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const lesson = await Lesson.query().findById(req.params.id);

    if (!lesson)
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });

    const query = sql("lesson_module")
      .select(
        "lesson_module.*",
        "lesson.name AS lesson_name",
        sql.raw("COUNT(lesson_dars.id) AS dars_count")
      )
      .leftJoin("lesson_dars", "lesson_module.id", "lesson_dars.module_id")
      .leftJoin("lesson", "lesson_module.lesson_id", "lesson.id")
      .where("lesson_module.lesson_id", req.params.id)
      .groupBy("lesson_module.id")
      .orderBy("lesson_module.id", "asc")
      .limit(limit)
      .offset(skip);

    const modules = await query;
    return res
      .status(200)
      .json({ success: true, data: modules, title: lesson.name });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getLessonModuleDetail = async (req, res) => {
  try {
    if (isNaN(parseInt(req.params.id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const module = await LessonModule.query().findById(req.params.id);
    return res.status(200).json({
      success: true,
      module,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getLessonDars = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 15;
    const skip = (page - 1) * limit;
    const module_id = parseInt(req.params.module_id);
    if (isNaN(module_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const module = await LessonModule.query().findById(module_id);

    const data = await sql("lesson_dars")
      .select("lesson_dars.*")
      .where("module_id", module_id)
      .orderBy("id", "desc")
      .limit(limit)
      .offset(skip);

    return res
      .status(200)
      .json({ success: true, data: data, title: module.name });
  } catch (error) {
    console.log(error);
  }
};

exports.createLessonDars = async (req, res) => {
  try {
    const { error, value } = createLDSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, msg: error.details[0].message });
    }

    const dars = await LessonDars.query().insert(value);

    if (!dars) return res.status(400).json({ success: false, msg: "Error" });

    const lesson = await sql("lesson")
      .select("lesson.*", "lesson_module.id AS module_id")
      .leftJoin("lesson_module", "lesson.id", "lesson_module.lesson_id")
      .where("lesson_module.id", value.module_id)
      .first();

    const groups = await sql("groups")
      .select("id")
      .where("direction_id", lesson.direction_id);

    console.log(groups);

    groups.forEach(async (group) => {
      await LessonOpen.query().insert({
        lesson_dars_id: dars.id,
        group_id: group.id,
        status: 0,
      });
    });

    return res.status(201).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};

exports.getDarsById = async (req, res) => {
  try {
    if (isNaN(parseInt(req.params.id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const tests = await Test.query().where("lesson_dars_id", req.params.id);

    const dars = await LessonDars.query().findById(req.params.id);
    return res
      .status(200)
      .json({ success: true, dars: dars, tests_count: tests.length });
  } catch (error) {
    console.log(error);
  }
};

exports.getDarsFiles = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 15;
    const skip = (page - 1) * limit;
    const dars_id = parseInt(req.params.dars_id);

    if (isNaN(dars_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const files = await sql("lesson_dars_files")
      .select("lesson_dars_files.*")
      .where("lesson_dars_id", dars_id)
      .orderBy("id", "desc")
      .limit(limit)
      .offset(skip);

    return res.status(200).json({ success: true, files });
  } catch (error) {
    console.log(error);
  }
};

exports.createLessonDarsFile = async (req, res) => {
  try {
    const { error, value } = createFileSchema.validate(req.body);

    if (error) {
      return res
        .status(400)
        .json({ success: false, msg: error.details[0].message });
    }

    const dars = await LessonDars.query().findById(value.lesson_dars_id);

    if (!dars) {
      return res.status(404).json({ success: false, message: "Dars not" });
    }

    const existData = await LessonDarsFiles.query().findOne({
      lesson_dars_id: value.lesson_dars_id,
      file_url: value.file_url,
    });

    if (existData) {
      return res.status(400).json({
        success: false,
        message: "already",
      });
    }

    const data = await LessonDarsFiles.query().insert(req.body);

    return res.status(201).json({ success: true, data });
  } catch (error) {
    console.log(error);
  }
};

exports.deleteLessonDarsFile = async (req, res) => {
  try {
    if (isNaN(parseInt(req.params.id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }
    const file = await LessonDarsFiles.query().findById(req.params.id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const deleted = await LessonDarsFiles.query().deleteById(req.params.id);

    return res.status(200).json({ success: true, deleted });
  } catch (error) {
    console.log(error);
  }
};

exports.getLessonList = async (req, res) => {
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
        "lesson_open.test_status"
      )
      .leftJoin("lesson_open", function () {
        this.on("lesson_dars.id", "=", "lesson_open.lesson_dars_id").on(
          "lesson_open.group_id",
          "=",
          group_id
        );
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

exports.changeDarsStatus = async (req, res) => {
  try {
    const { error, value } = changeStatusDarsSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, msg: error.details[0].message });

    await LessonOpen.query().insert(value);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

exports.changeTestStatus = async (req, res) => {
  try {
    const lesson_dars_id = parseInt(req.params.dars_id);
    if (isNaN(lesson_dars_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const { error, value } = changeStatusTestSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, msg: error.details[0].message });

    const nowDate = new Date();
    const lessonDars = await LessonOpen.query()
      .update({ test_status: value.status, test_open_date: nowDate })
      .where("lesson_dars_id", lesson_dars_id)
      .where("group_id", value.group_id)
      .first();

    return res.status(200).json({ success: true, lessonDars });
  } catch (error) {
    console.log(error);
  }
};

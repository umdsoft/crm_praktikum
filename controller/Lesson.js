const Lesson = require("../models/Lesson");
const LessonModule = require("../models/LessonModule");
exports.createLesson = async (req, res) => {
  try {
    await Lesson.query().insert({
      name: req.body.name,
      mentor_id: req.body.mentor_id,
      direction_id: req.body.direction_id,
      lesson_type: req.body.lesson_type,
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
    });
    return res.status(201).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};
exports.getAllLesson = async (req, res) => {
  try {
    const limit = req.query.limit || 15;
    const skip = (req.query.page - 1) * limit;
    const knex = await Lesson.knex();

    const allCourse = await knex.raw(`
    SELECT l.id AS id,
    l.name AS name,
    l.lesson_type AS type,
    lesson_status AS status,
    l.created AS created,
    l.mentor_id AS mentor_id,
    direc.name AS course,
	(SELECT count(*) from lesson_module lm WHERE lm.lesson_id = l.id) as module_count
FROM lesson AS l
LEFT JOIN direction direc ON direc.id = l.direction_id
ORDER BY l.id DESC;
    `);

    return res.status(200).json({
      success: true,
      data: allCourse[0],
      total: allCourse[0].length,
      limit: limit,
    });
  } catch (e) {
    console.log(e);
  }
};

exports.getAllLessonModule = async (req, res) => {
  try {
    const limit = req.query.limit || 15;
    const skip = (req.query.page - 1) * limit;
    const knex = await LessonModule.knex();
    const allCourse = await knex.raw(`
    SELECT lm.id AS id,
    lm.created AS created,
    lm.status AS status,
    lm.name AS name,
    les.name AS course
FROM lesson_module AS lm
LEFT JOIN lesson les ON les.id = lm.lesson_id
WHERE lm.lesson_id = ${req.query.course}
ORDER BY lm.id ASC;
      `);

    return res.status(200).json({
      success: true,
      data: allCourse[0],
      total: allCourse[0].length,
      limit: limit,
    });
  } catch (e) {
    console.log(e);
  }
};

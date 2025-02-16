const Course = require("../models/Direction");
const Module = require("../models/LessonModule");
exports.getAllCourse = async (req, res) => {
  try {
    const courses = await Course.query().select("*");
    res.status(200).json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};
exports.createModule = async (req, res) => {
  try {
    const { module_name, course_id } = req.body;
    await Module.query().insert({
      name: module_name,
      direction_id: course_id,
      status: 1,
      created: new Date(),
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    //res.status(500).json({ success: false, msg: "Internal server error" });
  }
};
exports.getModule = async (req, res) => {
  try {
    const modules = await Module.query().select("*").where("direction_id", req.params.id);
    return res.status(200).json({ success: true, modules });
  } catch (error) {
    console.log(error);
  }
};

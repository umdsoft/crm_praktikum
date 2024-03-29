const Student = require("../models/Student");
const { genNumber } = require("../setting/idNumbers");
const bcrypt = require("bcryptjs");
exports.createStudent = async (req, res) => {
  try {
    const lastDate = await Student.query()
      .select("*")
      .orderBy("id", "desc")
      .first();
    //generate ID Number for student
    const idsss = lastDate ? [`${lastDate.code}`] : ["100000AA"];
    const num = genNumber(idsss);
    //generate password  for student
    const salt = await bcrypt.genSaltSync(12);
    const password = await bcrypt.hashSync(num, salt);
    // create Student
    await Student.query().insert({
      code: num,
      password,
      full_name: req.body.full_name,
      role: 7,
      phone: req.body.phone,
      brightday: req.body.brightday,
      gender: req.body.gender,
      coin: 0,
    });
    return res.status(201).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};

exports.getAll = async (req, res) => {
  const limit = req.query.limit || 15;
  const skip = (req.query.page - 1) * limit;
  let allStudent;
  if (req.query.search) {
    console.log(req.query.search);
    allStudent = await Student.query()
      .where("code", "like", `%${req.query.search}%`)
      .select("*")
      .orderBy("id", "desc")
      .limit(limit)
      .offset(skip);
  } else {
    allStudent = await Student.query()
      .select("*")
      .orderBy("id", "desc")
      .limit(limit)
      .offset(skip);
  }
  return res.status(200).json({
    success: true,
    data: allStudent,
    total: allStudent.length,
    limit: limit,
  });
};

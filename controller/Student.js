const Student = require("../models/Student");
const { genNumber } = require("../setting/idNumbers");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authHelper = require("../helper/authHelper");
const secret = require("../setting/setting").jwt;
const Token = require("../models/Token");
const GroupStudentPay = require("../models/GroupStudentPay");
const { signUpSchema } = require("../helper/validator");
const some = require("../setting/mDb");

const updateTokens = (user_id) => {
  const accessToken = authHelper.generateAccessToken(user_id);
  const refreshToken = authHelper.generateRefreshToken();

  return authHelper
    .replaceDbRefreshToken(refreshToken.id, user_id)
    .then(() => ({
      accessToken,
      refreshToken: refreshToken.token,
    }));
};

const generateStatus = (status, payment_date, paid_date) => {
  const date1 = new Date(payment_date);
  const date2 = new Date();

  if (status === 0) {
    if (date1 < date2) {
      return 3;
    }
  }

  return status;
};

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

    const student = await Student.query()
      .where("phone", req.body.phone)
      .first();
    if (student) {
      return res.status(400).json({ success: false, msg: "user-exist" });
    }

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
  const skip = req.query.skip;
  let allStudent;

  const studentsCount = await Student.query().count("id as count").first();

  if (req.query.search) {
    allStudent = await Student.query()
      .where(function () {
        this.where("code", "like", `%${req.query.search}%`).orWhere(
          "phone",
          "like",
          `%${req.query.search}%`
        );
      })
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
    total: studentsCount.count,
    limit: limit,
  });
};

exports.login = async (req, res) => {
  try {
    const { error, value } = signUpSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, msg: error.details[0].message });
    }
    const user = await Student.query().where("phone", value.phone).first();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user-not-found" });
    }
    const isValid = await bcrypt.compare(value.password, user.password);

    if (isValid) {
      updateTokens(user.id).then((tokens) =>
        res.status(200).json({ success: true, tokens })
      );
    } else {
      return res
        .status(401)
        .json({ success: false, msg: "invalid-credebtials" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, msg: error.message });
  }
};
exports.refreshToken = async (req, res) => {
  try {
    let payload = jwt.verify(req.body.refreshToken, secret);
    if (payload.type !== "refresh") {
      return res.status(400).json({ success: false, msg: "invalid-token" });
    }
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      return res.status(400).json({ success: false, msg: "token-expiried" });
    } else if (e instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({ success: false, msg: "invalid-token" });
    }
  }
  await Token.query()
    .where("tokenId", payload.id)
    .first()
    .then((token) => {
      if (token === null) {
        throw new Error("Invalid token!");
      }
      return updateTokens(token.user_id);
    })
    .then((tokens) => res.json(tokens))
    .catch((err) => res.status(400).json({ success: false, msg: err.message }));
};

exports.getMe = async (req, res) => {
  try {
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);
    const user = await Student.query().where("id", candidate.user_id).first();
    return res.status(200).json({ success: true, data: user });
  } catch (e) {
    console.log(e);
  }
};

exports.getPayment = async (req, res) => {
  try {
    const limit = req.query.limit || 15;
    const skip = (req.query.page - 1) * limit;
    const searchTerm = req.query.search;

    const paymentsCount = await some("group_student_pay")
      .count("id as count")
      .first();

    let payments;

    if (searchTerm) {
      payments = await some("group_student_pay")
        .select(
          "group_student_pay.id as payment_id",
          "group_student_pay.code as payment_code",
          "group_student_pay.status as payment_status",
          "group_student_pay.amount as pay_amount",
          "group_student_pay.*",
          "groups.id as group_id",
          "groups.status as group_status",
          "groups.amount as group_amount",
          "groups.*",
          "student.id as student_id",
          "student.code as student_code",
          "student.*",
          "direction.id as direction_id",
          "direction.name as direction_name",
          "direction.code as direction_code"
        )
        .leftJoin("groups", "group_student_pay.group_id", "groups.id")
        .leftJoin("student", "group_student_pay.student_id", "student.id")
        .leftJoin("direction", "groups.direction_id", "direction.id")
        .where(function () {
          this.where("full_name", "like", `%${searchTerm}%`);
        })
        .limit(limit)
        .offset(skip)
        .orderBy("payment_status", "asc");
    } else {
      payments = await some("group_student_pay")
        .select(
          "group_student_pay.id as payment_id",
          "group_student_pay.code as payment_code",
          "group_student_pay.status as payment_status",
          "group_student_pay.amount as pay_amount",
          "group_student_pay.*",
          "groups.id as group_id",
          "groups.status as group_status",
          "groups.amount as group_amount",
          "groups.*",
          "student.id as student_id",
          "student.code as student_code",
          "student.*",
          "direction.id as direction_id",
          "direction.name as direction_name",
          "direction.code as direction_code"
        )
        .leftJoin("groups", "group_student_pay.group_id", "groups.id")
        .leftJoin("student", "group_student_pay.student_id", "student.id")
        .leftJoin("direction", "groups.direction_id", "direction.id")
        .limit(limit)
        .offset(skip)
        .orderBy("payment_status", "asc");
    }

    // Transform the result to match the desired data structure
    const formattedPayments = payments.map((payment) => ({
      id: payment.payment_id,
      status: generateStatus(
        payment.payment_status,
        payment.payment_date,
        payment.paid_date
      ),
      payment_date: payment.payment_date,
      paid_date: payment.paid_date,
      paid_time: payment.paid_time,
      gs_id: payment.gs_id,
      pay_type: payment.pay_type,
      amount: payment.pay_amount,
      discount: payment.discount,
      code: payment.payment_code,
      student: {
        id: payment.student_id,
        full_name: payment.full_name,
        code: payment.student_code,
        phone: payment.phone,
      },
      group: {
        id: payment.group_id,
        name: payment.direction_name,
      },
    }));

    return res.status(200).json({
      success: true,
      total: paymentsCount.count,
      limit: limit,
      data: formattedPayments,
    });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

exports.getStudentPay = async (req, res) => {
  try {
    const pay = await GroupStudentPay.query()
      .where("group_id", req.query.group_id)
      .andWhere('student_id', req.query.student_id)
    return res.status(200).json({ success: true, data: pay });
  } catch (e) {
    console.log(e);
  }
};

exports.getPay = async (req, res) => {
  try {
    const pay = await GroupStudentPay.query()
      .where("id", req.params.id)
      .first();
    return res.status(200).json({ success: true, data: pay });
  } catch (e) {
    console.log(e);
  }
};





exports.getStudentDetails = async (req, res) => {
  try {
    const student = await Student.query().where("id", req.params.id).first();
    return res.status(200).json({ success: true, data: student });
  } catch (e) {
    console.log(e);
  }
};

exports.editStudent = async (req, res) => {
  try {
    const student = await Student.query().where("id", req.params.id).first();
    if (!student) {
      return res.status(404).json({ success: false, msg: "student-not-found" });
    }
    await Student.query().where("id", req.params.id).update({
      full_name: req.body.full_name,
      phone: req.body.phone,
      brightday: req.body.brightday,
      gender: req.body.gender,
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
  }
};

exports.getStudentByCode = async (req, res) => {
  try {
    const student = await Student.query()
      .findOne("code", req.params.code)
    if (!student) {
      return res.status(200).json({ success: false, msg: 'u-n' })
    }
    return res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.log(error);
  }
};

exports.getStudentPayData = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { group_id } = req.query;

    if (isNaN(student_id) || isNaN(group_id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid request!" });

    const payments = await GroupStudentPay.knex().raw(`
      SELECT gsp.*, s.full_name, s.phone, gsp.code AS gsp_code, s.code AS student_code
      FROM group_student_pay AS gsp
      INNER JOIN student AS s ON gsp.student_id = s.id
      WHERE gsp.group_id = ${group_id} AND student_id = ${student_id};
    `);

    return res.status(200).json({ success: true, data: payments[0] });
  } catch (error) {
    console.log(error);
  }
};

exports.setDiscountStudent = async (req, res) => {
  try {
    const { gsp_id } = req.params;
    const { summa } = req.body;
    if (isNaN(gsp_id))
      return res.status(400).json({ success: false, msg: "Invalid group_id" });
    if (isNaN(summa))
      return res.status(400).json({ success: false, msg: "Invalid summa!" });

    const gsp = await GroupStudentPay.query().where("id", gsp_id).first();
    if (!gsp) return res.status(400).json({ success: false, msg: "not-found" });

    if (gsp.discount || gsp.status === 1)
      return res.status(400).json({ success: false, msg: "exist-discount" });

    await GroupStudentPay.query()
      .where("id", gsp_id)
      .update({
        amount: gsp.amount - summa,
        discount: (summa / (gsp.amount / 100)).toFixed(2),
      });

    return res.status(200).json({ success: true, msg: "ok" });
  } catch (error) {
    console.log(error);
  }
};

exports.getRentalStudent = async (req, res) => {
  try {
    const limit = req.query.limit || 15;
    const page = req.query.page || 1;
    const skip = (page - 1) * limit;
    const searchTerm = req.query.search;

    let paymentsQuery = some("group_student_pay")
      .select(
        "group_student_pay.id as payment_id",
        "group_student_pay.code as payment_code",
        "group_student_pay.status as payment_status",
        "group_student_pay.amount as pay_amount",
        "group_student_pay.*",
        "groups.id as group_id",
        "groups.status as group_status",
        "groups.amount as group_amount",
        "groups.*",
        "student.id as student_id",
        "student.code as student_code",
        "student.*",
        "direction.id as direction_id",
        "direction.name as direction_name",
        "direction.code as direction_code"
      )
      .leftJoin("groups", "group_student_pay.group_id", "groups.id")
      .leftJoin("student", "group_student_pay.student_id", "student.id")
      .leftJoin("direction", "groups.direction_id", "direction.id")
      .where("group_student_pay.status", 0) // Filter for status = 0
      .orderBy("payment_status", "asc");

    if (searchTerm) {
      paymentsQuery = paymentsQuery.where(function () {
        this.where("full_name", "like", `%${searchTerm}%`);
      });
    }

    // Add filter condition: today > payment_date
    const today = new Date();
    paymentsQuery = paymentsQuery.whereRaw("payment_date < ?", [today]);

    // Clone the query to count the total number of records
    const totalCountQuery = paymentsQuery
      .clone()
      .count("group_student_pay.id as count")
      .first();
    const totalCount = await totalCountQuery;

    // Apply pagination
    paymentsQuery = paymentsQuery.limit(limit).offset(skip);

    const payments = await paymentsQuery;

    // Transform the result to match the desired data structure
    const formattedPayments = payments.map((payment) => ({
      id: payment.payment_id,
      status: generateStatus(
        payment.payment_status,
        payment.payment_date,
        payment.paid_date
      ),
      payment_date: payment.payment_date,
      paid_date: payment.paid_date,
      paid_time: payment.paid_time,
      gs_id: payment.gs_id,
      pay_type: payment.pay_type,
      amount: payment.pay_amount,
      discount: payment.discount,
      code: payment.payment_code,
      student: {
        id: payment.student_id,
        full_name: payment.full_name,
        code: payment.student_code,
        phone: payment.phone,
      },
      group: {
        id: payment.group_id,
        name: payment.direction_name,
      },
    }));

    return res.status(200).json({
      success: true,
      total: totalCount.count, // Total count after filtering
      limit: limit,
      page: page,
      data: formattedPayments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
};

exports.getGroupLessonsWithStatus = async (req, res) => {
  try {
    const { group_id } = req.params;
    if (isNaN(group_id))
      return res.status(400).json({ success: false, msg: "Invalid group_id" })

    const groupStudents = await some("lesson").select(
      "lesson.*",
    )
      .orderBy("id", "asc")

    return res.status(200).json({ success: true, data: groupStudents });

  } catch (error) {
    console.log(error);
  }
};


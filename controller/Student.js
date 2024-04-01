const Student = require("../models/Student");
const { genNumber } = require("../setting/idNumbers");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authHelper = require("../helper/authHelper");
const secret = require("../setting/setting").jwt;
const Token = require("../models/Token");
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

exports.login = async (req, res) => {
  /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Avtorizatsiya qilish',
            schema: {
                $login: 'praktikum_admin',
                $password: 'qiyin parol'
            }
    } */
  try {
    const user = await Student.query().where("phone", req.body.phone).first();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user-not-found" });
    }
    const isValid = bcrypt.compareSync(req.body.password, user.password);
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

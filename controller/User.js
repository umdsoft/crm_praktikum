const jwt = require("jsonwebtoken");
const Users = require("../models/User");
const bcrypt = require("bcryptjs");
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

exports.register = async (req, res) => {
  /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Registratsiyadan o‘tish | Kerakli maydonlarni to‘ldiring',
            schema: {
                $name: 'Umidbek Jumaniyozov',
                $email: 'info@praktikum-academy.uz',
                $login: 'praktikum_admin',
                $password: 'qiyin parol'
            }
    } */
  const salt = await bcrypt.genSaltSync(12);
  const password = await bcrypt.hashSync(req.body.password, salt);
  const candidate = await Users.query().where("phone", req.body.phone).first();

  if (candidate) {
    return res.status(200).json({ success: false, msg: "user-yes" });
  }
  Users.query()
    .insert({
      password,
      role: req.body.role,
      phone: req.body.phone,
      name: req.body.name,
    })
    .catch((err) => {
      console.log(err);
    });

  return res.status(200).json({ success: true });
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
    const user = await Users.query().where("phone", req.body.phone).first();
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
exports.getAllUsers = async (req, res) => {
  /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
  const limit = req.query.limit || 10;
  const skip = (req.query.page - 1) * limit;
  const users = await Users.query()
    .select("*")
    .orderBy("id", "desc")
    .limit(limit)
    .offset(skip);
  return res.status(200).json({ success: true, data: users });
};

exports.editUser = async (req, res) => {
  const candidate = jwt.decode(req.headers.bearer);
  let password;
  if (req.body.password != null) {
    const salt = await bcrypt.genSaltSync(12);
    password = await bcrypt.hashSync(req.body.password, salt);
  } else {
    password = candidate.password;
  }
  await Users.query()
    .where("id", candidate.user_id)
    .update({
      password: password,
      email: req.body.email,
      phone: req.body.phone,
      name: req.body.name,
    })
    .then(() => {
      return res.status(200).json({ success: true });
    });
};

exports.me = async (req, res) => {
  const candidate = jwt.decode(req.headers.bearer);
  const user = await Users.query()
    .where("id", candidate.user_id)
    .first()
    .select("name", "email", "phone", "role");
  return res.status(200).json({ success: true, data: user });
};

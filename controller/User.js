const jwt = require("jsonwebtoken");
const Users = require("../models/User");
const bcrypt = require("bcryptjs");
const authHelper = require("../helper/authHelper");
const secret = require("../setting/setting").jwt;
const Token = require("../models/Token");
const { signUpValidator } = require("../helper/validator");
const Role = require("../models/Role");

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
exports.getRole = async (req, res) => {
  const role = await Role.query().orderBy("id", "desc");
  return res.status(200).json({ success: true, data: role });
};
exports.register = async (req, res) => {
  const salt = await bcrypt.genSaltSync(12);
  const password = await bcrypt.hashSync(req.body.phone, salt);
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
      status: 1,
      created: new Date(),
    })
    .catch((err) => {
      console.log(err);
    });

  return res.status(200).json({ success: true });
};

exports.login = async (req, res) => {
  try {
    // const { error, value } = signUpValidator.validate(req.body);
    // if (error) {
    //   console.log(error);
    //   return res
    //     .status(400)
    //     .json({ success: false, msg: error.details[0].message });
    // }
    const phone = req.body.phone.replace(/ /g, "");
    const user = await Users.query().where("phone", phone).first();
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
    console.log(req.body);
    let payload = jwt.verify(req.body.accessToken, secret);
    if (payload.type !== "refresh") {
      return res.status(400).json({ success: false, msg: "invalid-token" });
    }
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      console.log(1);
      return res.status(400).json({ success: false, msg: "token-expiried" });
    } else if (e instanceof jwt.JsonWebTokenError) {
      console.log(2);
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
    .select("id", "name", "phone", "role", "created", "status")
    .orderBy("id", "desc")
    .limit(limit)
    .offset(skip);
  return res.status(200).json({ success: true, data: users });
};

exports.editUser = async (req, res) => {
  try {
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);

    const userPhoneExist = await Users.query()
      .where("phone", req.body.phone)
      .first();
    if (userPhoneExist) {
      return res.status(400).json({ success: false, msg: "user-yes" });
    }

    const user = await Users.query().where("id", candidate.user_id).update({
      phone: req.body.phone,
      name: req.body.name,
    });

    if (!user) {
      return res.status(404).json({ success: false, msg: "user-not-found" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
  }

  // let password;
  // if (req.body.password != null) {
  //   const salt = await bcrypt.genSaltSync(12);
  //   password = await bcrypt.hashSync(req.body.password, salt);
  // } else {
  //   password = candidate.password;
  // }
  // await Users.query()
  //   .where("id", candidate.user_id)
  //   .update({
  //     password: password,
  //     email: req.body.email,
  //     phone: req.body.phone,
  //     name: req.body.name,
  //   })
  //   .then(() => {
  //     return res.status(200).json({ success: true });
  //   });
};

exports.me = async (req, res) => {
  try {
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);
    const user = await Users.query()
      .select("user.id", "user.name", "user.phone", "role.name as role")
      .leftJoin("role", "user.role", "role.id")
      .findOne("user.id", candidate.user_id);

    return res.status(200).json({ success: true, data: user });
  } catch (e) {
    console.log(e);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);
    const salt = await bcrypt.genSaltSync(12);
    const user = await Users.query().where("id", candidate.user_id).first();

    const comparePassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!comparePassword) {
      return res
        .status(400)
        .json({ success: false, msg: "password-not-match" });
    }

    const password = await bcrypt.hashSync(req.body.new_password, salt);
    await Users.query().where("id", candidate.user_id).update({
      password: password,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

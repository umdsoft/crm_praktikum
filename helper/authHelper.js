const jwt = require("jsonwebtoken");
const { secret, tokens } = require("../setting/setting").jwt;
const Token = require("../models/Token");

const generateAccessToken = (user_id) => {
  const payload = {
    user_id,
    type: tokens.access.type,
  };
  const options = { expiresIn: tokens.access.expiresIn };
  return jwt.sign(payload, secret, options);
};

const generateRefreshToken = () => {
  const uid = Math.floor(100000 + Math.random() * 900000);
  const payload = {
    id: uid,
    type: tokens.refresh.type,
  };
  const options = { expiresIn: tokens.refresh.expiresIn };
  return {
    id: payload.id,
    token: jwt.sign(payload, secret, options),
  };
};

const replaceDbRefreshToken = async (tokenId, user_id) => {
  await Token.query().where("user_id", user_id).delete();
  await Token.query().insert({ tokenId, user_id });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  replaceDbRefreshToken,
};

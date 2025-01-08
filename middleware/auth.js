const jwt = require("jsonwebtoken");
const { secret } = require("../setting/setting").jwt;
const User = require("../models/User");
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, msg: "token-no-provided" });
  }
  const token = authHeader.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, secret);
    if (payload.type !== "access") {
      return res.status(401).json({ success: false, msg: "invalid-token" });
    }
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, msg: "token-exited" });
    }
    if (e instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ success: false, msg: "invalid-token" });
    }
  }
  const candidate = jwt.decode(token);
  const user = await User.query()
    .select("user.id", "user.name", "user.phone", "role.name as role")
    .leftJoin("role", "user.role", "role.id")
    .findOne("user.id", candidate.user_id);
  req.user = user;
  next();
};



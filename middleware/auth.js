const jwt = require("jsonwebtoken");
const { secret } = require("../setting/setting").jwt;

module.exports = (req, res, next) => {
  const authHeader = req.headers.bearer;
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
  next();
};

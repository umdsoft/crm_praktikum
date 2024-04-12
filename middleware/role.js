const User = require("../models/User");
const Role = require("../models/Role");
exports.role = (role) => {
  return async (req, res, next) => {
    const thisRole = await Role.query().findById(role);
    if (thisRole.name !== role) {
      return res
        .status(403)
        .json({ message: "You are not allowed to access this route" });
    }
    next();
  };
};

const Joi = require("joi");

const validator = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    next();
  };
};
// +998911347773
const signUpSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().min(3).required(),
});

exports.signUpValidator = validator(signUpSchema);

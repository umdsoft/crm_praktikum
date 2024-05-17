const Joi = require("joi");

exports.createTask = Joi.object({
    text: Joi.string().required(),
    deadline: Joi.date().required(),
    list: Joi.array().items(Joi.number().required()).required(),   
})


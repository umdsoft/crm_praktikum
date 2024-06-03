const Joi = require("joi");

exports.createTask = Joi.object({
    text: Joi.string().required(),
    deadline: Joi.date().required(),
    list: Joi.array().items(Joi.number().required()).required(),   
})


exports.chatTaskCreate = Joi.object({
    task_id: Joi.number().required(),
    user_id: Joi.number().required(),
    text: Joi.string().required(),
})

exports.chatCreateSuper = Joi.object({
    text: Joi.string().required(),
    task: Joi.array().items(Joi.object({
        user_id: Joi.number().required(),
        task_id: Joi.number().required()
    })).required(),   
})
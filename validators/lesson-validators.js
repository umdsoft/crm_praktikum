const Joi = require("joi");

exports.createLDSchema = Joi.object({
    name: Joi.string().required(),
    text: Joi.string().required(),
    video_url: Joi.string().required(),
    module_id: Joi.number().required(),
    video_duration: Joi.number().required(),
})


exports.createFileSchema = Joi.object({
    file_url: Joi.string().required(),
    lesson_dars_id: Joi.number().required(),
})


exports.createTestSchema = Joi.object({
    text: Joi.string().required(),
    lesson_dars_id: Joi.number().required(),
    variants: Joi.array().items(Joi.object({
        text: Joi.string().required(),
        is_correct: Joi.boolean().required()
    })).required()
})


exports.checkTestSchema = Joi.object({
    test_id: Joi.number().required(),
    answers: Joi.array().items(Joi.number().required())
})

exports.changeStatusDarsSchema = Joi.object({
    status: Joi.number().required()
})





// testschema = {
//     lesson_dars_id: 1,
//     tests: [
//         {
//             test_id: 1,
//             corrects: [1, 2]
//         },
//     ]
// }
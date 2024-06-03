const sql = require("../setting/mDb.js");
const jwt = require("jsonwebtoken");
const {
  createTestSchema,
  checkTestSchema,
} = require("../validators/lesson-validators.js");
const LessonDars = require("../models/LessonDars.js");
const TestVariants = require("../models/TestVariants.js");
const TestFinish = require("../models/TestFinish.js");


const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

exports.getTests = async (req, res) => {
  try {
    const dars_id = parseInt(req.params.dars_id);
    if (isNaN(dars_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const tests = await sql("test")
      .select(
        "test.id as test_id",
        "test.text as test_text",
        "test.created_at",
        "test.status",
        "test_variants.id as variant_id",
        "test_variants.text as variant_text",
        "test_variants.is_correct as variant_is_correct"
      )
      .leftJoin("test_variants", "test.id", "test_variants.test_id")
      .where({
        lesson_dars_id: dars_id,
      })
      .orderBy("test.id", "desc");

    // Group tests and their variants
    const groupedTests = {};
    tests.forEach((test) => {
      if (!groupedTests[test.test_id]) {
        groupedTests[test.test_id] = {
          id: test.test_id,
          text: test.test_text,
          created_at: test.created_at,
          status: test.status,
          variants: [],
        };
      }
      if (test.variant_id) {
        groupedTests[test.test_id].variants.push({
          id: test.variant_id,
          text: test.variant_text,
          is_correct: test.variant_is_correct,
        });
      }
    });

    const result = Object.values(groupedTests);

    return res.status(200).json({ success: true, tests: result });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getModuleTests = async (req, res) => {
  try {
    const module_id = parseInt(req.params.module_id);
    if (isNaN(module_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    // Retrieve tests for the specified module
    const tests = await sql("test")
      .select(
        "test.id as test_id",
        "test.text as test_text",
        "test.created_at",
        "test.status",
        "test_variants.id as variant_id",
        "test_variants.text as variant_text",
        "test_variants.is_correct as variant_is_correct"
      )
      .leftJoin("test_variants", "test.id", "test_variants.test_id")
      .leftJoin("lesson_dars", "test.lesson_dars_id", "lesson_dars.id")
      .where("lesson_dars.module_id", module_id)
      .orderBy("test.id", "desc");

    // Group tests and their variants
    const groupedTests = {};
    tests.forEach((test) => {
      if (!groupedTests[test.test_id]) {
        groupedTests[test.test_id] = {
          id: test.test_id,
          text: test.test_text,
          created_at: test.created_at,
          status: test.status,
          variants: [],
        };
      }
      if (test.variant_id) {
        groupedTests[test.test_id].variants.push({
          id: test.variant_id,
          text: test.variant_text,
          is_correct: test.variant_is_correct,
        });
      }
    });

    const result = Object.values(groupedTests);

    return res.status(200).json({ success: true, tests: result });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.createTest = async (req, res) => {
  try {
    const { error, value } = createTestSchema.validate(req.body);
    if (error)
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });

    const lessonDars = await LessonDars.query().findById(value.lesson_dars_id);
    if (!lessonDars)
      return res.status(400).json({
        success: false,
        message: "Dars not found",
      });

    const createdTest = await sql("test").insert({
      lesson_dars_id: value.lesson_dars_id,
      text: value.text,
    });

    for (const variant of value.variants) {
      await sql("test_variants").insert({
        test_id: createdTest[0],
        text: variant.text,
        is_correct: variant.is_correct,
      });
    }

    return res.status(201).json({ success: true });
  } catch (error) {
    console.log(error);
  }
};


exports.getOneTest = async (req, res) => {
  try {
    const test_id = parseInt(req.params.test_id);
    if (isNaN(test_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test ID",
      });
    }

    const test = await sql("test")
    .select('test.*')
    .where('test.id', test_id).first()

    if (!test)
      return res.status(400).json({
        success: false,
        message: "Test not found",
      });

      const testVariants = await TestVariants.query().where('test_id', test_id)
      if (!testVariants)
      return res.status(400).json({
        success: false,
        message: "Test variants not found",
      });



      const result = {
        id: test.id,
        text: test.text,
        created_at: test.created_at,
        status: test.status,
        variants: shuffleArray(testVariants),
      };

      return res.status(200).json({ success: true, test: result });

  } catch (error) {
    console.log(error);
  }
}


exports.deleteTest = async (req, res) => {
  try {
    const test_id = parseInt(req.params.test_id);
    if (isNaN(test_id)) {
      return res.status(400).json({
        success: false, 
        message: "Invalid test ID",
      });
    }

    const isDelete = await TestFinish.query().where('test_id', test_id).first()

    if (isDelete) return res.status(400).json({ success: false, message: "no" });

    const deleted = await sql("test").delete().where('id', test_id);
   
    await sql("test_variants").delete().where('test_id', test_id);

    return res.status(200).json({ success: true });

  } catch (error) {
    if (error.response.status === 500) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
    console.log(error);
  }
}


exports.checkTest = async (req, res) => {
  try {
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1])


    const { error, value } = checkTestSchema.validate(req.body)
    if (error)
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });

    let result = {
      test_id: value.test_id,
      answers: value.answers,
      corrects: [],
      score: 0,
    }

    const testVariants = await TestVariants.query().where('test_id', value.test_id)

    value.answers.forEach(async (item) => {
    const isExist = testVariants.find(variant => variant.id == item)
        if (isExist) {
            result.score += 1
            result.corrects.push(isExist.id)
        }
    })

    
    
    const finishExist = await sql('test_finish').select('id').where({
        test_id: result.test_id,
        student_id: candidate.user_id
    }).first()


    
    
    if (finishExist) return res.status(400).json({
        success: false,
        message: 'Test already finished'
    })

    const finish = await TestFinish.query().insert({
        student_id: candidate.user_id,
        test_id: result.test_id,
        score: result.score,
        answers: result.answers.join(', ')
    })


    return res.status(200).json({
        success: true,
        result: finish
    })



  } catch (error) {
    console.log(error);
  }
};

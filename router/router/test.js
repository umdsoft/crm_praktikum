const Lesson = require("../../controller/Lesson");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");
const Test = require("../../controller/Test");

router.get('/get/module/:module_id', authMiddleware, Test.getModuleTests);
router.get('/get/:dars_id', authMiddleware, Test.getTests);
router.get('/get/one/:test_id', authMiddleware, Test.getOneTest);
router.delete('/delete/:test_id', authMiddleware, Test.deleteTest);

router.post('/create', authMiddleware, Test.createTest);
router.post('/check', authMiddleware, Test.checkTest);

module.exports = router;

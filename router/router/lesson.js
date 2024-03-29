const Lesson = require("../../controller/Lesson");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.post("/create", Lesson.createLesson);
router.get("/get-all", Lesson.getAllLesson);

router.post("/module/create", Lesson.createLessonModule);
router.get("/module/get-all", Lesson.getAllLessonModule);

module.exports = router;

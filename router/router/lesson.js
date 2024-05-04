const Lesson = require("../../controller/Lesson");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.post("/create",authMiddleware, Lesson.createLesson);
router.get("/get-all",authMiddleware, Lesson.getAllLesson);

router.post("/module/create",authMiddleware, Lesson.createLessonModule);
router.get("/module/get-all/:id",authMiddleware, Lesson.getAllLessonModule);

module.exports = router;

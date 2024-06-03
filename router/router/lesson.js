const Lesson = require("../../controller/Lesson");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.post("/create",authMiddleware, Lesson.createLesson);
router.get("/get-all",authMiddleware, Lesson.getAllLesson);

router.post("/module/create",authMiddleware, Lesson.createLessonModule);
router.get("/module/get-all/:id",authMiddleware, Lesson.getAllLessonModule);
router.get("/module/detail/:id", authMiddleware, Lesson.getLessonModuleDetail);

router.get("/dars/:module_id", authMiddleware, Lesson.getLessonDars)
router.get("/dars/detail/:id", authMiddleware, Lesson.getDarsById)
router.post("/dars/create", authMiddleware, Lesson.createLessonDars)

router.get("/dars/files/:dars_id", authMiddleware, Lesson.getDarsFiles)
router.post("/dars/file/create", authMiddleware, Lesson.createLessonDarsFile)
router.delete("/dars/file/delete/:id", authMiddleware, Lesson.deleteLessonDarsFile)




module.exports = router;

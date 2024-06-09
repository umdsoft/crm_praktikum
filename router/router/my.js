const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");
const My = require("../../controller/My"); 

router.get("/groups", authMiddleware, My.getGroups)
router.get("/lessons/:group_id", authMiddleware, My.getMyLessons)
router.get("/modules/:lesson_id", authMiddleware, My.getMyModules)
router.get("/dars/", authMiddleware, My.getMyLessonDars)
router.get("/dars/details/:id", authMiddleware, My.getDarsById)


module.exports = router;

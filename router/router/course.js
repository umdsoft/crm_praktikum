const Course = require("../../controller/Course");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.get("/get-all", authMiddleware, Course.getAllCourse);
router.post("/create-module", authMiddleware, Course.createModule);
router.get("/get-module/:id", authMiddleware, Course.getModule);
module.exports = router;

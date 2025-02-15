const Course = require("../../controller/Course");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.get("/get-all", authMiddleware, Course.getAllCourse);

module.exports = router;

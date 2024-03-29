const Student = require("../../controller/Student");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.post("/create", Student.createStudent);
router.get("/get-all", Student.getAll);

module.exports = router;

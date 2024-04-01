const Student = require("../../controller/Student");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.post("/create", Student.createStudent);
router.get("/get-all", Student.getAll);

router.post("/login", Student.login);
router.get("/get-me", authMiddleware, Student.getMe);

router.get('/payment', Student.getPayment)
module.exports = router;

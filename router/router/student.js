const Student = require("../../controller/Student");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.post("/create",authMiddleware, Student.createStudent);
router.get("/get-all",authMiddleware, Student.getAll);

router.post("/login", Student.login);
router.get("/get-me",authMiddleware, authMiddleware, Student.getMe);

router.get('/payment',authMiddleware, Student.getPayment)
module.exports = router;

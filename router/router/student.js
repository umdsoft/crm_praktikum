const Student = require("../../controller/Student");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.post("/create", authMiddleware, Student.createStudent);
router.get("/get-all", authMiddleware, Student.getAll);
router.get("/details/:id", authMiddleware, Student.getStudentDetails);
router.put("/edit/:id", authMiddleware, Student.editStudent);


router.post("/login", Student.login);
router.get("/get-me", authMiddleware, authMiddleware, Student.getMe);

router.get("/payment", authMiddleware, Student.getPayment);

router.get("/get-pay/:id", authMiddleware, Student.getPay);
router.get('/get-student-pay',authMiddleware, Student.getStudentPay)
router.post("/pay/:id", authMiddleware, Student.createPay);
router.get("/by-code/:code", authMiddleware, Student.getStudentByCode)

router.get("/get-pay-type", authMiddleware, Student.getPayType);
router.get("/pay-data/:student_id", authMiddleware, Student.getStudentPayData)
router.put("/discount/:gsp_id", authMiddleware, Student.setDiscountStudent)
router.get("/group-lessons/:group_id", authMiddleware, Student.getGroupLessonsWithStatus)

router.get("/rentals", authMiddleware, Student.getRentalStudent)

module.exports = router; 
 
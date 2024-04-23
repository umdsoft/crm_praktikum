const Group = require("../../controller/Group");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.post("/create", authMiddleware, Group.create);
router.get("/get-all", authMiddleware, Group.getAllGroup);
router.get("/get-data", authMiddleware, Group.getDate);
router.post("/create-group-student", authMiddleware, Group.createGroupStudent);
router.get("/check-student/:id", authMiddleware, Group.checkStudent);
router.post("/start-group", authMiddleware, Group.startGroup);
router.get("/get/:id", authMiddleware, Group.getOneCourseData);
router.get("/service", authMiddleware, Group.getServices);
router.get("/get-mentor", authMiddleware, Group.getAllMentor);
router.get("/student-contract/:id", authMiddleware, Group.getGroupUserContractData);


module.exports = router;

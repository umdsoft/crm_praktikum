const Group = require("../../controller/Group");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.post("/create", Group.create);
router.get("/get-all", Group.getAllGroup);
router.get("/get-data", Group.getDate);
router.post("/create-group-student", Group.createGroupStudent);
router.get('/check-student/:id', Group.checkStudent);
router.post("/start-group", Group.startGroup);
router.get("/get/:id", Group.getOneCourseData);
router.get("/service", Group.getServices);
module.exports = router;

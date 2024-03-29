const Group = require("../../controller/Group");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.post("/create", Group.create);
router.get("/get-all", Group.getAllGroup);
router.get("/get-data", Group.getDate);
router.post("/create-group-student", Group.createGroupStudent);
router.post("/start-group", Group.startGroup);
router.get("/get/:id", Group.getOneCourseData);

module.exports = router;

const Group = require("../../controller/Group");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.post("/create", authMiddleware, Group.create);
router.get("/get-all", authMiddleware, Group.getAllGroup);
router.get("/get-data", authMiddleware, Group.getDate);
router.post("/create-group-student", authMiddleware, Group.createGroupStudent);
router.post("/check-student", authMiddleware, Group.checkStudent);
router.post("/start-group", authMiddleware, Group.startGroup);
router.post("/end-group/:id", authMiddleware, Group.endGroup);
router.get("/get/:id", authMiddleware, Group.getOneCourseData);
router.get("/service", authMiddleware, Group.getServices);
router.get("/get-mentor", authMiddleware, Group.getAllMentor);
router.get(
  "/student-contract/:id",
  authMiddleware,
  Group.getGroupUserContractData
);
router.get("/group-students/:id", authMiddleware, Group.getGroupStudents);
router.get(
  "/group-student-pays/:group_id",
  authMiddleware,
  Group.getGroupStudentsPays
);
router.post("/add-checkup", authMiddleware, Group.postCheckStudent);
router.put("/change-status/:group_id", authMiddleware, Group.changeStatus);

router.get("/details/:id", authMiddleware, Group.getGroupDetails);
router.get("/group-checkup/:id", authMiddleware, Group.getCheckUpGroup);

router.post("/start-lesson", authMiddleware, Group.startLesson);
router.post("/end-lesson/:id", authMiddleware, Group.endLesson);

router.post("/delete-student/:id", authMiddleware, Group.deleteStudentGroup);

router.get("/check-group", authMiddleware, Group.getCheckGroupData);
router.get("/check-group/:id", authMiddleware, Group.getOneCheckGroupLesson);

module.exports = router;

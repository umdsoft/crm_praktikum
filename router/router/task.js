const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");
const Task = require("../../controller/Task");

router.post("/create", authMiddleware, Task.createTask);
router.get("/", authMiddleware, Task.getTasks);
router.get("/:id", authMiddleware, Task.getTaskById);
router.put("/change-status/:id", authMiddleware, Task.changeStatus);
router.put("/task-user-status/:id", authMiddleware, Task.changeTaskUserStatus);


module.exports = router;

const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");
const Task = require("../../controller/Task");

router.post("/create", authMiddleware, Task.createTask);
router.get("/", authMiddleware, Task.getTasks);
router.get("/get/:id", authMiddleware, Task.getTaskById);
router.get("/get/me/:id", authMiddleware, Task.getTaskMyById);
router.get("/user", authMiddleware, Task.getTaskByIdByUserId);
router.put("/change-status/:id", authMiddleware, Task.changeStatus);
router.put("/task-user-status/:id", authMiddleware, Task.changeTaskStatus);
router.put("/change-tus/:id", authMiddleware, Task.changeTaskUserStatus)
router.get("/counts", authMiddleware, Task.getStatusCounts)
router.get("/me/counts", authMiddleware, Task.getMeStatusCounts)
router.get("/chat", authMiddleware, Task.getChatData)
router.post("/chat", authMiddleware, Task.postChatData)
router.delete("/chat/delete/:id", authMiddleware, Task.deleteChat)

router.get("/super/chat/:task_id", authMiddleware, Task.getChatForSuper)
router.post("/super/chat", authMiddleware, Task.postSuperChatData)

module.exports = router;

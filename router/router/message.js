const Message = require("../../controller/Message");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.post("/send",authMiddleware, Message.createMessage);
router.get("/get-all",authMiddleware, Message.getAllMessage);

module.exports = router;

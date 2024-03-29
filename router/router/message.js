const Message = require("../../controller/Message");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.post("/send", Message.createMessage);
router.get("/get-all", Message.getAllMessage);

module.exports = router;

const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");
const My = require("../../controller/My"); 

router.get("/groups", authMiddleware, My.getGroups)

module.exports = router;

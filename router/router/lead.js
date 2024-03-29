const Lead = require("../../controller/Lead");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.get('/get-target', Lead.getTarget)
router.post('/create', Lead.create)

module.exports = router;

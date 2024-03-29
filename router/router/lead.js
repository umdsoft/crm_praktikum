const Lead = require("../../controller/Lead");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.get("/get-target", Lead.getTarget);
router.post("/create", Lead.create);

router.put("/edit-action/:id", Lead.editAction);
router.get("/get-lead", Lead.getByNew);

module.exports = router;

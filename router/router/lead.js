const Lead = require("../../controller/Lead");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.get("/get-target", authMiddleware, Lead.getTarget);
router.post("/create", authMiddleware, Lead.create);
router.post("/register", Lead.register);
router.post("/create-site", Lead.createSite);
router.get("/by-id/:id", authMiddleware, Lead.getById);
router.put("/edit-action/:id", authMiddleware, Lead.editAction);
router.get("/get-lead", authMiddleware, Lead.getByNew);

router.put("/edit-lead/:id", authMiddleware, Lead.editLead);
router.post("/interest/", authMiddleware, Lead.postInterested);
router.get("/interest/:lead_id", authMiddleware, Lead.getInterested);

module.exports = router;

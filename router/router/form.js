const AdForm = require("../../controller/AdForm");
const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");

router.post("/create", authMiddleware, AdForm.createAdForm);
router.get("/link/:id", AdForm.getData);

module.exports = router;

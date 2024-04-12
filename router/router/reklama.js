const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");
const Reklama = require("../../controller/Reklama");

router.post("/createAds", authMiddleware, Reklama.createAds);
router.get("/getAds", authMiddleware, Reklama.getAds);
router.get('/get-link/:id', Reklama.getLink)

module.exports = router;
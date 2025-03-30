const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");
const Statistic = require("../../controller/Statistic");

router.get('/admin-home', Statistic.getAdminHomeStatistic)
router.get('/ad-statistic',Statistic.adStatistic)

module.exports = router;
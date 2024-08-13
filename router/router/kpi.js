const router = require("express").Router();
const authMiddleware = require("../../middleware/auth");
const KPI = require("../../controller/Kpi");

router.post("/create-kpi", KPI.createKpiSm);
router.post("/create-daily-plan", KPI.createDailyPlan);
router.get("/get-operator-kpi", KPI.getOperatorKpi);

module.exports = router;

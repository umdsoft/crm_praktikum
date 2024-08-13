const KpiPlan = require("../models/KpiPlan");
const KpiDaily = require("../models/KpiDaily");
const User = require("../models/User");
exports.createKpiSm = async (req, res) => {
  try {
    const user = await User.query().where("role", 2);
    user.forEach(async (element) => {
      const name = `KPI ${req.body.start_date} - ${req.body.end_date} | ${element.name}`;
      await KpiPlan.query().insert({
        ...req.body,
        user_id: element.id,
        name: name,
      });
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

exports.createDailyPlan = async (req, res) => {
  try {
    await KpiDaily.query().insert(req.body);
    return res.status(201).json({ success: true });
  } catch (error) {
    console.log(error);
  }
};
exports.getOperatorKpi = async (req, res) => {
  try {
    const knex = await KpiDaily.knex()
    const data = await knex.raw('call get_all_operators_kpi_week(3)')
    return res.status(200).json(data[0]);
  } catch (error) {
    console.log(error);
  }
}
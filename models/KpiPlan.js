const { Model } = require("objection");
const knex = require("../setting/mDb");

Model.knex(knex);

class KpiPlan extends Model {
  static get tableName() {
    return "kpi_plan";
  }
}

module.exports = KpiPlan;

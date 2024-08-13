const { Model } = require("objection");
const knex = require("../setting/mDb");

Model.knex(knex);

class KpiDaily extends Model {
  static get tableName() {
    return "kpi_daily";
  }
}

module.exports = KpiDaily;

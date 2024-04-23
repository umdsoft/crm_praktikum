const { Model } = require("objection");
const knex = require("../setting/mDb");

Model.knex(knex);

class PayType extends Model {
  static get tableName() {
    return "pay_type";
  }
}

module.exports = PayType;

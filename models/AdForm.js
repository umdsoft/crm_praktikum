const { Model } = require("objection");
const knex = require("../setting/mDb");

Model.knex(knex);

class AdForm extends Model {
  static get tableName() {
    return "ad_form";
  }
}

module.exports = AdForm;

const { Model } = require("objection");
const knex = require("../setting/mDb");

Model.knex(knex);

class NewLead extends Model {
  static get tableName() {
    return "new_lead";
  }
}

module.exports = NewLead;

const { Model } = require("objection");
const knex = require("../setting/mDb");

Model.knex(knex);

class Day extends Model {
  static get tableName() {
    return "lesson_day";
  }
}

module.exports = Day;

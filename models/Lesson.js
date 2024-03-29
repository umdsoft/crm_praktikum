const { Model } = require("objection");
const knex = require("../setting/mDb");

Model.knex(knex);

class Lesson extends Model {
  static get tableName() {
    return "lesson";
  }
}

module.exports = Lesson;

const { Model } = require("objection");
const knex = require("../setting/mDb");

Model.knex(knex);

class LessonOpen extends Model {
  static get tableName() {
    return "lesson_open";
  }
}

module.exports = LessonOpen;

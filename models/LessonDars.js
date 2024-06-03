const { Model } = require("objection");
const knex = require("../setting/mDb");

Model.knex(knex);

class LessonDars extends Model {
  static get tableName() {
    return "lesson_dars";
  }
}

module.exports = LessonDars;

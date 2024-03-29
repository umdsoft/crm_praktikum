const { Model } = require("objection");
const knex = require("../setting/mDb");

Model.knex(knex);

class LessonModule extends Model {
  static get tableName() {
    return "lesson_module";
  }
}

module.exports = LessonModule;

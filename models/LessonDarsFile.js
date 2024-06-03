const { Model } = require("objection");
const knex = require("../setting/mDb");

Model.knex(knex);

class LessonDarsFiles extends Model {
  static get tableName() {
    return "lesson_dars_files";
  }
}

module.exports = LessonDarsFiles;

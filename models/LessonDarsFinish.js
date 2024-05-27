const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class LessonDarsFinish extends Model {
	static get tableName() {
		return "lesson_dars_finish"
	}
}

module.exports = LessonDarsFinish

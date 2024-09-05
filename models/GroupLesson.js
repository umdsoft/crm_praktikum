const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class GroupLesson extends Model {
	static get tableName() {
		return "group_lesson"
	}
}

module.exports = GroupLesson

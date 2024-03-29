const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class Time extends Model {
	static get tableName() {
		return "lesson_time"
	}
}

module.exports = Time

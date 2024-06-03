const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class Task extends Model {
	static get tableName() {
		return "task"
	}
}

module.exports = Task

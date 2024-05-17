const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class TaskUser extends Model {
	static get tableName() {
		return "task_user"
	}
}

module.exports = TaskUser

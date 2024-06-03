const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class TaskChat extends Model {
	static get tableName() {
		return "task_chat"
	}
}

module.exports = TaskChat

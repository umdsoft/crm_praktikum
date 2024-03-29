const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class Message extends Model {
	static get tableName() {
		return "message"
	}
}

module.exports = Message

const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class Room extends Model {
	static get tableName() {
		return "room"
	}
}

module.exports = Room

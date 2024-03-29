const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class Direction extends Model {
	static get tableName() {
		return "direction"
	}
}

module.exports = Direction

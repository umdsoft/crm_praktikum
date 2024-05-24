const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class Test extends Model {
	static get tableName() {
		return "test"
	}
}

module.exports = Test

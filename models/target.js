const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class Target extends Model {
	static get tableName() {
		return "target"
	}
}

module.exports = Target

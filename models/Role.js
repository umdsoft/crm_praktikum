const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class Role extends Model {
	static get tableName() {
		return "role"
	}
}

module.exports = Role

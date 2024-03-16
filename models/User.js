const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class User extends Model {
	static get tableName() {
		return "user"
	}
}

module.exports = User
const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class Token extends Model {
	static get tableName() {
		return "token"
	}
}

module.exports = Token

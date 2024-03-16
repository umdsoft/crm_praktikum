const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class Reklama extends Model {
	static get tableName() {
		return "reklama"
	}
}

module.exports = Reklama

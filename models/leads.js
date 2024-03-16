const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class Leads extends Model {
	static get tableName() {
		return "leads"
	}
}

module.exports = Leads

const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class LeadInterested extends Model {
	static get tableName() {
		return "lead_interest"
	}
}

module.exports = LeadInterested

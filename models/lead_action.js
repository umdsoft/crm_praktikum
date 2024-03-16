const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class LeadAction extends Model {
	static get tableName() {
		return "lead_action.js"
	}
}

module.exports = LeadAction

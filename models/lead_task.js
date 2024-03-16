
const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class LeadTask extends Model {
	static get tableName() {
		return "lead_task"
	}
}

module.exports = LeadTask

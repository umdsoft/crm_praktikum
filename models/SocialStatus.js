const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class SocialStatus extends Model {
	static get tableName() {
		return "social_status"
	}
}

module.exports = SocialStatus

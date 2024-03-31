const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class Project extends Model {
	static get tableName() {
		return "project"
	}
}

module.exports = Project

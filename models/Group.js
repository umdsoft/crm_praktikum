const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class Group extends Model {
	static get tableName() {
		return "groups"
	}
}

module.exports = Group

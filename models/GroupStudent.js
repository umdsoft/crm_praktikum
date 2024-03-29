const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class GroupStudent extends Model {
	static get tableName() {
		return "group_student"
	}
}

module.exports = GroupStudent

const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class StudentCheck extends Model {
	static get tableName() {
		return "group_student_checkup"
	}
}

module.exports = StudentCheck

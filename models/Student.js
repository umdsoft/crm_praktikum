const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class Student extends Model {
	static get tableName() {
		return "student"
	}
}

module.exports = Student

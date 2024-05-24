const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class TestFinish extends Model {
	static get tableName() {
		return "test_finish"
	}
}

module.exports = TestFinish

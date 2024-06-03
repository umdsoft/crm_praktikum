const { Model } = require("objection")
const knex = require("../setting/mDb")

Model.knex(knex)

class TestVariants extends Model {
	static get tableName() {
		return "test_variants"
	}
}

module.exports = TestVariants

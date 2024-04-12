const { Model } = require("objection");
const knex = require("../setting/mDb");

Model.knex(knex);

class ShortUrl extends Model {
  static get tableName() {
    return "short_url";
  }
}

module.exports = ShortUrl;

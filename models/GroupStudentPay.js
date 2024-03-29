const { Model } = require("objection");
const knex = require("../setting/mDb");

Model.knex(knex);

class GroupStudentPay extends Model {
  static get tableName() {
    return "group_student_pay";
  }
}

module.exports = GroupStudentPay;

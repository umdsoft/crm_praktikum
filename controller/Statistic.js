const Student = require("../models/Student");
exports.getAdminHomeStatistic = async (req, res) => {
  try {
    const totalStudent = await Student.knex().raw(
      "SELECT COUNT(*) as count FROM student"
    );
    const totalGroup = await Student.knex().raw(
      "SELECT COUNT(*) as count FROM group_student"
    );
    const totalAmountThisMonth = await Student.knex().raw(
      "SELECT sum(amount) as amount, count(*) as count FROM group_student_pay gsp WHERE gsp.status = 1 and year(CURRENT_DATE()) = year(gsp.paid_date) and month(CURRENT_DATE()) = month(gsp.paid_date)"
    );
    console.log(totalAmountThisMonth[0][0])
    return res.status(200).json({ success: true, data: { totalStudent:totalStudent[0][0].count, totalGroup:totalGroup[0][0].count, totalAmountThisMonth: totalAmountThisMonth[0][0] } });
  } catch (error) {
    console.log(error);
  }
};

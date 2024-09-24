const GroupStudent = require("../models/GroupStudent");
const StudentPay = require("../models/GroupStudentPay");
const Group = require("../models/Group");
exports.getAdminHomeStatistic = async (req, res) => {
  try {
    const totalStudent = await GroupStudent.knex()
      .raw(`SELECT COUNT(DISTINCT gs.student_id) AS currently_studying_students
FROM group_student gs
WHERE gs.status = 1;`);
    const totalGroup = await Group.knex().raw(
      "SELECT COUNT(*) as count FROM groups g where g.status = 1"
    );
    const totalGroup2 = await Group.knex().raw(
      "SELECT COUNT(*) as count FROM groups g where g.status = 0"
    );
    const totalThisMonth = await StudentPay.knex().raw(
      "SELECT sum(amount) as amount FROM group_student_pay gsp WHERE year(CURRENT_DATE()) = year(gsp.payment_date) and month(CURRENT_DATE()) = month(gsp.payment_date);"
    );

    const qarz = await await StudentPay.knex().raw(
      "SELECT sum(amount) as amount FROM group_student_pay gsp WHERE gsp.status = 0 and DATE(gsp.payment_date) < CURRENT_DATE();"
    );
    const stat = await StudentPay.knex().raw(`
      SELECT 
        DATE_FORMAT(paid_date, '%d.%m.%Y') AS payment_day, 
       SUM(amount) AS total_payment
     FROM 
       group_student_pay
     WHERE 
       status = 1
       AND payment_date >= CURDATE() - INTERVAL 30 DAY
     GROUP BY 
       DATE(payment_date)
     ORDER BY 
       payment_day ASC;
       `);
    const dataPoints = stat[0].map((row) => ({
      label: row.payment_day, // Date as the label
      y: parseInt(row.total_payment), // Total payment as the y value
    }));
    return res.status(200).json({
      success: true,
      data: {
        totalStudent: totalStudent[0][0].currently_studying_students,
        totalGroup: totalGroup[0][0].count,
        totalGroup2: totalGroup2[0][0].count,
        totalAmountThisMonth: totalThisMonth[0][0].amount,
        qarz: qarz[0][0].amount,
        dataPoints,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getHomeData = async (req, res) => {
  try {
    const cur_student = await GroupStudent.knex()
      .raw(`SELECT COUNT(DISTINCT gs.student_id) AS currently_studying_students
FROM group_student gs
WHERE gs.status = 1;`);
    return res.status(200).json({
      success: true,
      data: {
        cur_student: cur_student[0][0],
      },
    });
  } catch (e) {
    console.log(e);
  }
};

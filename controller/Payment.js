const StudentPay = require("../models/GroupStudentPay");
const PayType = require("../models/PayType");
const sql = require("../setting/mDb");
const { generateRandomString } = require("../setting/randomString");

exports.getAllPayment = async (req, res) => {
  const limit = req.query.limit || 15;
  const skip = req.query.skip;
  let paymentCountQuery = sql("group_student_pay"); // Initialize the groups count query
  let groupsCount = await paymentCountQuery.count("id as count").first();

  let search;
  if (req.query.search) {
    search = `where s.code like '%${req.query.search}%'`;
  } else {
    search = " ";
  }

  const knex = await StudentPay.knex();
  const data = await knex.raw(`
        SELECT 
            gsp.id as id, 
            s.code, 
            s.full_name, 
            gsp.amount, 
            gsp.status, 
            gsp.payment_date, 
            gsp.paid_date, 
            gsp.paid_time ,
            s.phone,
            g.code as gcode,
            g.id as group_id,
            s.id as student_id,
            g.main_mentor
        FROM 
        group_student_pay gsp 
        left join student s on gsp.student_id = s.id
        left join groups g on gsp.group_id = g.id
        ${search}
        order by gsp.status,gsp.payment_date asc        
        limit ${limit} offset ${skip}       
    `);

  return res
    .status(200)
    .json({ success: true, data: data[0], total: groupsCount.count });
};

exports.paymetStatistic = async (req, res) => {
  const totalAmountThisMonth = await StudentPay.knex().raw(
    "SELECT sum(amount) as amount FROM group_student_pay gsp WHERE gsp.status = 1 and year(CURRENT_DATE()) = year(gsp.paid_date) and month(CURRENT_DATE()) = month(gsp.paid_date)"
  );
  const totalAmountThisDay = await StudentPay.knex().raw(
    "SELECT sum(amount) as amount, count(*) as count FROM group_student_pay gsp WHERE gsp.status = 1 and DATE(gsp.paid_date) = CURRENT_DATE()"
  );
  const totalThisMonth = await StudentPay.knex().raw(
    "SELECT sum(amount) as amount FROM group_student_pay gsp WHERE year(CURRENT_DATE()) = year(gsp.payment_date) and month(CURRENT_DATE()) = month(gsp.payment_date);"
  );

  const qarz = await StudentPay.knex().raw(
    "SELECT sum(amount) as amount FROM group_student_pay gsp WHERE gsp.status = 0 and DATE(gsp.payment_date) < CURRENT_DATE();"
  );


  return res.status(200).json({
    success: true,
    data: {
      totalAmountThisDay: totalAmountThisDay[0][0],
      totalAmountThisMonth: totalAmountThisMonth[0][0],
      totalThisMonth: totalThisMonth[0][0],
      qarz: qarz[0][0],
    },
  });
};

exports.getOneStudentPay = async (req, res) => {
  const knex = await StudentPay.knex();

  const data = await knex.raw(`
        SELECT 
            gsp.id as id, 
            s.code, 
            s.full_name, 
            gsp.amount, 
            gsp.status, 
            gsp.payment_date, 
            gsp.paid_date, 
            gsp.paid_time ,
            s.phone,
            g.code as gcode,
            g.id as group_id,
            s.id as student_id,
            g.main_mentor
        FROM 
        group_student_pay gsp 
        left join student s on gsp.student_id = s.id
        left join groups g on gsp.group_id = g.id
        where s.id = ${req.query.student_id} and g.id = ${req.query.group_id}
        order by gsp.status,gsp.payment_date asc    
    `);

  return res.status(200).json({ success: true, data: data[0] });
};

exports.createPay = async (req, res) => {
  try {
    const currentDate = new Date();
    const formattedTime = currentDate.toISOString().slice(11, 19);
    if (req.body.pay_tolov == "1") {
      await StudentPay.query().where("id", req.params.id).update({
        status: 1,
        teacher_id: req.body.teacher_id,
        paid_time: formattedTime,
        paid_date: req.body.pay_data,
        pay_type: req.body.pay_type,
        // code: generateRandomString(8),
      });
      return res.status(201).json({ success: true });
    } else if (req.body.pay_tolov == "2") {
      const sp = await StudentPay.query().findOne("id", req.params.id);
      await StudentPay.query().insert({
        status: 0,
        amount: sp.amount - req.body.amount,
        payment_date: req.body.last_pay_data,
        student_id: sp.student_id,
        group_id: sp.group_id,
        gs_id: sp.gs_id,
      });
      await StudentPay.query().where("id", req.params.id).update({
        status: 1,
        teacher_id: req.body.teacher_id,
        paid_time: formattedTime,
        amount: req.body.amount,
        paid_date: req.body.pay_data,
        pay_type: req.body.pay_type,
        // code: generateRandomString(8),
      });
      return res.status(201).json({ success: true });
    }
  } catch (e) {
    console.log(e);
  }
};

exports.getOnePaymentDetail = async (req, res) => {
  try {
    const knex = await StudentPay.knex();
    const payment = await knex.raw(`
            SELECT 
                gsp.id,
                s.full_name,
                s.phone,
                gs.contract,
                g.code,
                gsp.amount,
                g.main_mentor
            FROM group_student_pay gsp
            left join student s on gsp.student_id = s.id
            left join groups g on gsp.group_id = g.id
            left join group_student gs on gsp.gs_id = gs.id
            where gsp.id = ${req.params.id};
        `);
    return res.status(200).json({ success: true, data: payment[0][0] });
  } catch (e) {
    console.log(e);
  }
};

exports.getPayType = async (req, res) => {
  try {
    const type = await PayType.query().select("*");
    return res.status(200).json({ success: true, data: type });
  } catch (e) {
    console.log(e);
  }
};

exports.salary_report = async (req, res) => {
  try {
    const knex = await StudentPay.knex();
    const data = await knex.raw(`
            SELECT 
                u.name,
                u.phone,
                SUM(gsp.amount) as all_pay,
                (SUM(gsp.amount) * (u.salary / 100) ) as salary,
                ((SUM(gsp.amount) * (u.salary / 100)) * 0.075) as soliq
            FROM group_student_pay gsp
            left join user u on gsp.teacher_id = u.id 
            where gsp.status = 1 and YEAR(gsp.paid_date)=YEAR(CURDATE()) and MONTH(gsp.paid_date) = MONTH(CURDATE())
            GROUP by gsp.teacher_id;    
        `);
    return res.status(200).json({ success: true, data: data[0] });
  } catch (e) {
    console.log(e);
  }
};

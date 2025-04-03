const GroupStudent = require("../models/GroupStudent");
const StudentPay = require("../models/GroupStudentPay");
const Group = require("../models/Group");
const NodeCache = require("node-cache");
const NewLeads = require("../models/NewLead");
const AdForm = require("../models/AdForm");
const statsCache = new NodeCache({
  stdTTL: 300, // 5 minutes TTL (time to live)
  checkperiod: 120, // Check for expired entries every 2 minutes
});
exports.getAdminHomeStatistic = async (req, res) => {
  try {
    // Use Promise.all for parallel execution of independent queries
    const [
      totalStudentResult,
      totalActiveGroupsResult,
      totalInactiveGroupsResult,
      monthlyAmountResult,
      debtResult,
      paymentStatsResult,
    ] = await Promise.all([
      // Total active students
      GroupStudent.knex()
        .countDistinct("gs.student_id as currently_studying_students")
        .from("group_student as gs")
        .where("gs.status", 1)
        .first(),

      // Total active groups
      Group.knex()
        .count("* as count")
        .from("groups as g")
        .where("g.status", 1)
        .first(),

      // Total inactive groups
      Group.knex()
        .count("* as count")
        .from("groups as g")
        .where("g.status", 0)
        .first(),

      // Total amount this month
      StudentPay.knex()
        .sum("amount as amount")
        .from("group_student_pay as gsp")
        .whereRaw("YEAR(CURRENT_DATE()) = YEAR(gsp.payment_date)")
        .andWhereRaw("MONTH(CURRENT_DATE()) = MONTH(gsp.payment_date)")
        .first(),

      // Total debt (unpaid amounts before today)
      StudentPay.knex()
        .sum("amount as amount")
        .from("group_student_pay as gsp")
        .where("gsp.status", 0)
        .andWhere("gsp.payment_date", "<", new Date())
        .first(),

      // Last 30 days payment statistics
      StudentPay.knex()
        .select(
          StudentPay.knex().raw(
            "DATE_FORMAT(paid_date, '%d.%m.%Y') as payment_day"
          ),
          StudentPay.knex().raw("SUM(amount) as total_payment")
        )
        .from("group_student_pay")
        .where("status", 1)
        .andWhere(
          "paid_date",
          ">=",
          StudentPay.knex().raw("CURDATE() - INTERVAL 30 DAY")
        )
        .groupByRaw("DATE(payment_date)")
        .orderBy("payment_day", "asc"),
    ]);

    // Process payment stats into data points
    const dataPoints = paymentStatsResult.map((row) => ({
      label: row.payment_day,
      y: parseInt(row.total_payment) || 0,
    }));

    // Return response
    return res.status(200).json({
      success: true,
      data: {
        totalStudent: totalStudentResult.currently_studying_students || 0,
        totalGroup: totalActiveGroupsResult.count || 0,
        totalGroup2: totalInactiveGroupsResult.count || 0,
        totalAmountThisMonth: monthlyAmountResult.amount || 0,
        qarz: debtResult.amount || 0,
        dataPoints,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.adStatistic = async (req, res) => {
  try {
    // SQL so'rovi parametrlar bilan xavfsiz tarzda yozilgan
    const { date } = req.query; // Oylik ma'lumotlarni so'rov parametridan olish
    if (!date) {
      return res
        .status(400)
        .json({ success: false, message: "Date parameter is required" });
    }

    const statistic = await NewLeads.knex().raw(
      `
      SELECT 
        t.name AS platform, -- Platforma nomi (target jadvalidan)
        COUNT(nl.id) AS all_lead, -- Umumiy lid soni (barcha action lar uchun)
        SUM(CASE WHEN nl.action IN (2, 3, 5) THEN 1 ELSE 0 END) AS sifatli_lid, -- Sifatli lidlar soni (action=2, 3, 5)
        SUM(CASE WHEN nl.action = 1 THEN 1 ELSE 0 END) AS yangi_lid, -- Yangi lidlar soni (action=1)
        SUM(CASE WHEN nl.action = 6 THEN 1 ELSE 0 END) AS sifatsiz_lid, -- Sifatsiz lidlar soni (action=6)
        SUM(CASE WHEN nl.action = 2 THEN 1 ELSE 0 END) AS kursga_yozilgan, -- Kursga yozilganlar soni (action=2)
        SUM(CASE WHEN nl.action = 4 THEN 1 ELSE 0 END) AS suxbat_belgilangan, -- Suxbat belgilanganlar soni (action=4)
        SUM(CASE WHEN nl.action = 3 THEN 1 ELSE 0 END) AS oqish_boshlagan -- Suxbat belgilanganlar soni (action=4)
      FROM 
        new_lead nl
      JOIN 
        target t ON nl.target_id = t.id -- new_lead jadvali va target jadvali oralig'i
      WHERE 
        DATE_FORMAT(nl.created, '%Y-%m') = ? -- Faqat tanlangan oylik ma'lumotlar
      GROUP BY 
        t.name;
    `,
      [date]
    );
    const stat = await AdForm.knex().raw(
      `
      SELECT 
        af.name AS form_name, -- Forma nomi (ad_form jadvalidan)
        COUNT(l.id) AS lead_count -- Har bir forma uchun kelgan lidlar soni
      FROM 
        ad_form af
      LEFT JOIN 
        leads l ON af.id = l.form_id -- ad_form va leads jadvali orasidagi bog'lanish
    
      GROUP BY 
        af.name -- Forma nomi bo'yicha guruhlash
      ORDER BY 
        lead_count DESC; -- Lidlar soni bo'yicha kamayish tartibida saralash
    `
    );

    // Natijani talab qilingan formatga o'zlashtirish
    const malumot = {
      form_name: [],
      lead_count: [],
    };

    stat[0].forEach((row) => {
      malumot.form_name.push(row.form_name); // Forma nomlari
      malumot.lead_count.push(row.lead_count); // Har bir forma uchun lidlar soni
    });

    // Chart statistikasini talab qilingan formatga keltirish
    const chartStatistic = {
      platforms: [],
      all_leads: [],
    };

    statistic[0].forEach((row) => {
      chartStatistic.platforms.push(row.platform); // Platformalar nomlari
      chartStatistic.all_leads.push(row.all_lead); // Har bir platformaga tegishli umumiy lidlar soni
    });

    // Natijani qaytarish
    return res.status(200).json({
      success: true,
      data: {
        chart: chartStatistic, // Talab qilingan chart formati
        all: statistic[0], // Barcha statistik ma'lumotlar
        malumot,
      },
    });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
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

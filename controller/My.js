const sql = require("../setting/mDb.js");
const jwt = require("jsonwebtoken");

exports.getGroups = async (req, res) => {
  try {
    const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);

    const groups = await sql('group_student').select(
        "group_student.id as id",
        "groups.id as group_id",
        "groups.start_date as start_date",
        "lesson_day.name as lesson_day",
        "lesson_time.name as lesson_time",
        "direction.name as direction_name",
        "user.name as mentor"
    )
    .leftJoin('groups', 'group_student.group_id', 'groups.id')
    .leftJoin('lesson_day', 'groups.day', 'lesson_day.id')
    .leftJoin('lesson_time', 'groups.time', 'lesson_time.id') 
    .leftJoin('direction', 'groups.direction_id', 'direction.id')
    .leftJoin('user', 'groups.main_mentor', 'user.id')
    .where('student_id', candidate.user_id)
    


    return res.status(200).json({ success: true, data: groups });
  } catch (e) {
    console.log(e);
  }
};


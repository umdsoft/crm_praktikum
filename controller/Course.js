const Course = require('../models/Direction')

exports.getAllCourse = async (req, res) => {
    try {
        const courses = await Course.query().select('*');
        res.status(200).json({ success: true, courses });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Internal server error" });
    }
}

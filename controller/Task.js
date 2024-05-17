const TaskSchema = require("../validators/task");
const Task = require("../models/Task");
const sql = require("../setting/mDb.js")
const jwt = require("jsonwebtoken");
const TaskUser = require("../models/TaskUser.js");
const User = require("../models/User.js");


exports.createTask = async (req, res) => {
    try {
        const { error } = TaskSchema.createTask.validate(req.body)
        if (error) {
            return res
                .status(400)
                .json({ success: false, message: error.details[0].message });
        }
        const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);
        if (candidate.user_id != 1) {
            return res.status(401).json({ success: false, message: "unauthorized" });
        }

        const deadline = new Date(req.body.deadline)

        const task = await Task.query().insert({
            text: req.body.text,
            deadline,
            created_user: candidate.user_id
        })

        if (!task) return res.status(404).json({ success: false, message: "Task not found" })

        req.body.list.forEach(async (item) => {
            const taskUser = await TaskUser.query().where({
                task_id: task.id,
                user_id: item
            }).first()

            if (!taskUser) {
                await TaskUser.query().insert({
                    task_id: task.id,
                    user_id: item
                })
            }

        })


        return res.status(200).json({ success: true })
    } catch (e) {
        console.log(e);
    }
}

exports.getTasks = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, task_text = '' } = req.query; // Default page = 1, limit = 10
        const offset = (page - 1) * limit;

        const tasksQuery = sql("task")
            .select("task.*")
            .leftJoin("user", "task.created_user", "user.id")
            .leftJoin("role", "user.role", "role.id")
            .orderBy("task.id", "desc")
            .limit(limit)
            .offset(offset);

        if (status) {
            tasksQuery.where("task.status", status);
        }

        if (task_text) {
            tasksQuery.andWhere("task.text", "like", `%${task_text}%`);
        }

        const tasks = await tasksQuery;

        const userCounts = await sql("task_user")
            .select("task_id")
            .count("user_id as user_count")
            .groupBy("task_id");

        // Mapping user counts to tasks
        const tasksWithUserCount = tasks.map(task => {
            const userCount = userCounts.find(count => count.task_id === task.id);
            return {
                ...task,
                user_count: userCount ? userCount.user_count : 0
            };
        });

        const tasksCountQuery = sql("task").count("id as count");

        if (status) {
            tasksCountQuery.where("task.status", status);
        }

        if (task_text) {
            tasksCountQuery.andWhere("task.text", "like", `%${task_text}%`);
        }

        const tasksCount = await tasksCountQuery;

        return res.status(200).json({ success: true, tasks: tasksWithUserCount, total: tasksCount[0].count });

    } catch (e) {
        console.log(e);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};






exports.getTaskById = async (req, res) => {
    try {
        const { id } = req.params
        if (isNaN(parseInt(id))) return res.status(400).json({
            success: false,
            message: "Invalid ID"
        })

        const task = await sql("task")
            .select(
                "task.*",
                "user.id as user_id",
                "user.name as user_name",
                "role.name as role_name",
            )
            .leftJoin("user", "task.created_user", "user.id")
            .leftJoin("role", "user.role", "role.id")
            .where("task.id", id).first()

        const taskUsers = await sql("task_user")
            .select(
                "task_user.*",
                "user.id as user_id",
                "user.name as user_name",
                "role.name as role_name"
            )
            .leftJoin("user", "task_user.user_id", "user.id")
            .leftJoin("role", "user.role", "role.id")
            .where("task_user.task_id", id)


        if (!task) return res.status(404).json({
            success: false,
            message: "Task not found"
        })


        return res.status(200).json({ success: true, task, taskUsers });

    } catch (e) {
        console.log(e);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}



exports.changeStatus = async (req, res) => {
    try {
        const { id } = req.params
        if (isNaN(parseInt(id))) return res.status(400).json({
            success: false,
            message: "Invalid ID"
        })

        await sql("task").update({
            status: req.body.status
        }).where("id", id)

        return res.status(200).json({ success: true })

    } catch (e) {
        console.log(e)
    }
}


exports.changeTaskUserStatus = async (req, res) => {
    try {

        const candidate = jwt.decode(req.headers.authorization.split(" ")[1])

        const user = await User.query().where("id", candidate.user_id).first()
        if (user.status !== 1) return res.status(401).json({ success: false, message: "unauthorized" })

        const { id } = req.params
        const { status } = req.body
        if (isNaN(parseInt(id)) || isNaN(parseInt(status))) return res.status(400).json({
            success: false,
            message: "Invalid ID"
        })

        const data = await TaskUser.query().where({
            id: id
        }).update({
            status
        })

        return res.status(200).json({ success: true })
    } catch (e) {
        console.log(e)
    }
}
const TaskSchema = require("../validators/task");
const Task = require("../models/Task");
const sql = require("../setting/mDb.js")
const jwt = require("jsonwebtoken");
const TaskUser = require("../models/TaskUser.js");
const User = require("../models/User.js");
const TaskChat = require("../models/TaskChat.js");


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


exports.getTaskMyById = async (req, res) => {
    try {
        const { id } = req.params
        if (isNaN(parseInt(id))) return res.status(400).json({
            success: false,
            message: "Invalid ID"
        })

        const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);

        const tu = await TaskUser.query().where({
            task_id: id,
            user_id: candidate.user_id
        }).first()

        if (candidate.user_id != 1 && tu?.view_datetime == null) {
            const currentDateTime = new Date();

            await TaskUser.query().where({
                task_id: id,
                user_id: candidate.user_id
            }).first().update({
                view_datetime: currentDateTime,
            })
        }


        const taskUser = await TaskUser.query().where({
            task_id: id,
            user_id: candidate.user_id
        }).first()

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


        return res.status(200).json({ success: true, task, taskUsers, me: taskUser });

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


exports.changeTaskStatus = async (req, res) => {
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


exports.getTaskByIdByUserId = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, task_text = '' } = req.query; // Default page = 1, limit = 10
        const offset = (page - 1) * limit;

        const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);

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

        // Filter tasks based on candidate's user_id in task_user table
        tasksQuery.whereExists(sql("task_user")
            .whereRaw("task_user.task_id = task.id")
            .andWhere("task_user.user_id", candidate.user_id));

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

        // Filter tasks count based on candidate's user_id in task_user table
        tasksCountQuery.whereExists(sql("task_user")
            .whereRaw("task_user.task_id = task.id")
            .andWhere("task_user.user_id", candidate.user_id));

        const tasksCount = await tasksCountQuery;

        return res.status(200).json({ success: true, tasks: tasksWithUserCount, total: tasksCount[0].count });

    } catch (e) {
        console.log(e);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}




exports.changeTaskUserStatus = async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body
        if (isNaN(parseInt(id)) || isNaN(parseInt(status))) return res.status(400).json({
            success: false,
            message: "Invalid ID"
        })

        let currentDateTime = new Date();

        const data = await TaskUser.query().where({
            id: id
        }).update({
            status,
            action_date: currentDateTime
        })

        return res.status(200).json({ success: true })
    } catch (e) {
        console.log(e)
    }
}

exports.getStatusCounts = async (req, res) => {
    try {
        const taskStatusCounts = await sql("task")
            .select("status")
            .count("* as count")
            .groupBy("status");

        const totalTasksCount = await sql("task").count("* as total");

        return res.status(200).json({ success: true, taskStatusCounts, total: totalTasksCount[0].total });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


exports.getMeStatusCounts = async (req, res) => {
    try {
        const candidate = jwt.decode(req.headers.authorization.split(" ")[1]);

        const taskStatusCounts = await sql("task")
            .select("status")
            .count("* as count")
            .groupBy("status")
            .whereExists(sql("task_user")
                .whereRaw("task_user.task_id = task.id")
                .andWhere("task_user.user_id", candidate.user_id));

        const totalUserTasksCount = await sql("task_user")
            .where("user_id", candidate.user_id)
            .count("* as total");

        return res.status(200).json({ success: true, taskStatusCounts, total: totalUserTasksCount[0].total });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}




exports.getChatData = async (req, res) => {
    try {
        const { user_id, task_id } = req.query

        if (isNaN(parseInt(user_id)) || isNaN(parseInt(task_id))) return res.status(400).json({
            success: false,
            message: "Invalid ID"
        })


        const chats = await TaskChat.query().where({
            task_id: task_id,
            user_id: user_id
        }).orderBy("created", "asc")

        return res.status(200).json({ success: true, chats })

    } catch (error) {
        console.log(error);
    }
}



exports.postChatData = async (req, res) => {
    try {
        const { error, value } = TaskSchema.chatTaskCreate.validate(req.body) //task_id, text
        const candidate = jwt.decode(req.headers.authorization.split(" ")[1])

        if (error) return res.status(400).json({
            success: false,
            message: error.details[0].message
        })

      
        const newChat = await TaskChat.query().insert({
            task_id: value.task_id,
            user_id: value.user_id,
            text: value.text,
            isSuper: false
        })

        return res.status(200).json({ success: true, newChat })

    } catch (error) {
        console.log(error)
    }
}

exports.getChatForSuper = async (req, res) => {
    try {
        const task_id = parseInt(req.params.task_id)
        if (isNaN(task_id)) return res.status(400).json({
            success: false,
            message: "Invalid ID"
        })

        const chats = await sql('task_chat')
            .select(
                "task_chat.*",
                "user.name as user_name",
                "role.name as role_name",
            )
            .leftJoin("user", "task_chat.user_id", "user.id")
            .leftJoin("role", "user.role", "role.id")
            .orderBy("task_chat.created", "asc")
            .where("task_chat.task_id", task_id)

        return res.status(200).json({ success: true, chats })

    } catch (error) {
        console.log(error)
    }
}

exports.postSuperChatData = async (req, res) => {
    try {
        const { error, value } = TaskSchema.chatCreateSuper.validate(req.body) //text, task
        if (error) return res.status(400).json({
            success: false,
            message: error.details[0].message
        })

        value.task.forEach(async (item) => {
            await TaskChat.query().insert({
                task_id: item.task_id,
                user_id: item.user_id,
                text: value.text,
                isSuper: true
            })
        })

        return res.status(200).json({ success: true })

    } catch (error) {
        console.log(error)
    }
}




exports.deleteChat = async (req, res) => {
    try {
        const { id } = req.params
        const chatId = parseInt(id)
        if (isNaN(chatId)) return res.status(400).json({
            success: false,
            message: "Invalid ID"
        })

        const chat = await TaskChat.query().where("id", chatId).first()
        if (!chat) return res.status(400).json({
            success: false,
            message: "not-fount"
        })

        await TaskChat.query().delete().where("id", chatId)

        return res.status(200).json({ success: true })
    } catch (error) {
        console.log(error)
    }
}
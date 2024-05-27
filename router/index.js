const express = require("express")
const app = express()
app.use("/user", require("./router/user"))
app.use("/message", require("./router/message"))
app.use("/student", require("./router/student"))
app.use("/group", require("./router/group"))
app.use("/lesson", require("./router/lesson"))
app.use("/lead", require("./router/lead"))
app.use("/reklama", require("./router/reklama"))
app.use("/task", require("./router/task"))
app.use("/test", require("./router/test"))

app.use("/my", require("./router/my"));


module.exports = app;

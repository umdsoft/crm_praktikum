const express = require("express");
const app = express();
app.use("/user", require("./router/user"));
app.use("/message", require("./router/message"));
app.use("/student", require("./router/student"));
app.use("/group", require("./router/group"));
app.use("/lesson", require("./router/lesson"));
app.use("/lead", require("./router/lead"));
app.use("/reklama", require("./router/reklama"));

app.use('/test/user', require('./test/User'))
module.exports = app;

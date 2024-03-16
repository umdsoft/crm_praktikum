const express = require("express");
const app = express();
app.use('/user',require('./router/user'))
module.exports = app;

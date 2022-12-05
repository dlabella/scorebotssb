const basicAuth = require('./modules/express-basic-auth.js');
const session = require('express-session');
const fs = require("fs/promises");
const path = require("path");
const express = require("express");
var minify = require('express-minify');
const userService = require('./services/user.service');
const template = require('./services/template.engine.service');
const compression = require('compression');

const { env } = require('process');
var mode = env.NODE_ENV || 'development';
var debug = (mode != 'production');

userService.load();

var app = express();
if (!debug) {
  app.use(compression());
  app.use(minify());
}
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use(session({
  secret: 'scorebotSecretCat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));

app.use(basicAuth({
  challenge: true,
  realm: 'Score Bot',
  authorizeAsync: true,
  authorizer: userAuthorizer
}));


var port = process.env.PORT || 4000;
console.log("Loading Data");

function userAuthorizer(username, password, req, cb) {
  userService.authenticate(username, password).then((user) => {
    if (user) {
      req.session.login = true;
      req.session.user = user;
      return cb(null, true)
    }
    return cb(null, false)
  });
}

app.listen(port, () => {
  console.log("Server running on port " + port);
});

app.use(express.static('content'));

app.use("/user", require('./controllers/users.controller'));
app.use("/data", require('./controllers/data.controller'));
app.use("/history", require('./controllers/history.controller'));
app.use("/match", require('./controllers/match.controller'));
app.use("/teamMatch", require('./controllers/teamMatch.controller'));
app.use("/crew", require('./controllers/crew.controller'));

var templatePath = getTemplatePath();
var sharedPartialsPath = getSharedPartialsPath();

app.get("/", async (req, res, next) => {

  if (!userService.isAdmin(req)) {
    res.status(403);
    return;
  }
  var view = "";
  var basePath = templatePath + path.sep + "admin";
  if (userService.isSuperUser(req)) {
    view = await template.render(sharedPartialsPath, basePath, "su-admin.html");
  } else {
    view = await template.render(sharedPartialsPath, basePath, "admin.html");
  }
  res.send(view);
});

app.get("/sbusers", async (req, res, next) => {

  if (!userService.isAdmin(req)) {
    res.status(403);
    return;
  }
  var view = "";
  var basePath = templatePath + path.sep + "admin";
  view = await template.render(sharedPartialsPath, basePath, "sbusers.html");
  res.send(view);
});

function getTemplatePath() {
  return __dirname + path.sep + "templates";
}

function getSharedPartialsPath() {
  return getTemplatePath() + path.sep + "shared-partials";
}

module.exports = app;
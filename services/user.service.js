const config = require('./config.service.js').getConfig();
const sheetId =config.usersSheetId;
const basicAuth = require('../modules/express-basic-auth.js');

var users = null;
var adminKey = config.adminKey;
const googleSheet = require('./googlesheet.service');

module.exports = {
    load,
    addUser,
    getAll,
    authenticate,
    isLogged,
    isAdmin,
    isSuperUser
};

var doc = null;

async function load() {
    users = {};
    var userdata = await getUsers(true);
    for (var row of userdata.data) {
        var name = row[1];
        var password = row[2];
        var role = row[3];
        users[name] = {
            password: password,
            role: role
        }
    }
}

async function addUser(userName, password, role) {
    if (doc == null) {
        await loadDocument();
    }
    var currentUser = users[userName];
    if (currentUser) {
        return false;
    }

    var usersSheet = await doc.sheetsByIndex[0];
    var row = {
        "user": userName,
        "password": password,
        "role": role,
    }
    var rows = [];
    rows.push(row);
    try {
        await usersSheet.addRows(rows);
        users[userName] = {
            password: password,
            role: role
        }
        return true;
    } catch (ex) {
        doc = null;
        return false;
    }
}

async function authenticate(username, password) {
    if (basicAuth.safeCompare(username, "sbadmin") && basicAuth.safeCompare(password, adminKey)) {
        return {
            name: "sbadmin",
            role: "su"
        };
    }

    if (users == null) {
        return null;
    }

    var userData = users[username];
    if (userData && basicAuth.safeCompare(password, userData.password)) {
        return {
            name: username,
            role: userData.role
        };
    }
    return null;
}

async function getAll() {
    var result = [];
    for (var userKey in users) {
        result.push({
            name: userKey,
            password: users[userKey].password,
            role: users[userKey].role
        });
    }
    return result;
}

function isLogged(req) {
    if (req.session && req.session.login) {
        return true;
    }
    return false;
}

function isAdmin(req) {
    if (req.session && req.session.login && req.session.user && (req.session.user.role == "su" || req.session.user.role == "admin")) {
        return true;
    }
    return false;
}

function isSuperUser(req) {
    if (req.session && req.session.login && req.session.user && (req.session.user.name === "teatime" || req.session.user.name === "sbadmin") && (req.session.user.role == "su" || req.session.user.role == "admin")) {
        return true;
    }
    return false;
}

async function getUsers(forced) {
    if (forced === "true" || doc == null) {
        tableData = null;
        await loadDocument();
    }
    try {
        if (tableData == null) {
            tableData = await googleSheet.getSpreadSheedData(doc,0);
        }
        return tableData;
    } catch (ex) {
        doc = null;
    }
    return null;
}

async function loadDocument() {
    doc = await googleSheet.getDocument(sheetId);
}

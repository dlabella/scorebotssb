const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');

// routes
router.get('/', getAll);
router.post('/', newUser);

module.exports = router;

function getAll(req, res, next) {
    if (!userService.isAdmin(req)) {
        res.send(400);
        return;
    }

    userService.getAll()
        .then(users => {
            var data = [];
            for (var user of users) {
                var userData = [];
                userData.push(user.name);
                userData.push(user.password);
                userData.push(user.role);
                data.push(userData);
            }
            res.json(data)
        })
        .catch(err => next(err));
}

function newUser(req, res, next) {
    if (!userService.isSuperUser(req)) {
        res.send(400);
        return;
    }

    var data = req.body;
    if (data.userName && data.password && data.userRole) {
        userService.addUser(data.userName, data.password, data.userRole)
            .then(() => {
                res.status(200);
            })
            .catch(err => next(err));
    }
    res.status(400);
}


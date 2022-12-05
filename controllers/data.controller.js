const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const dataService = require('../services/data.service');
// routes
router.get('/', getScoreBoard);

module.exports = router;

function getScoreBoard(req, res, next) {
    if (!userService.isLogged(req)) {
        res.sendStatus(403);
    }

    var forced = req.query.forced || false;
    dataService.getScoreBoard(forced)
        .then((score) => {
            if (score) {
                res.json(score);
            } else {
                res.sendStatus(500);
            }
        })
        .catch(err => next(err));
}


const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const dataService = require('../services/data.service');

// routes
router.post('/', addTeamMatch);

module.exports = router;

function addTeamMatch(req, res, next) {
  if (!userService.isAdmin(req)) {
    res.status(403);
    return;
  }
  dataService.addTeamMatch(req.body)
    .then((ok) => {
      if (ok) {
        res.sendStatus(200);
      } else {
        res.sendStatus(500);
      }
    })
    .catch(err => next(err));
}


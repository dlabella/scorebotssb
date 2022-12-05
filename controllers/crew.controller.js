const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const dataService = require('../services/data.service');

// routes
router.post('/', addCew);
router.post('/rename', renameCew);
router.post('/delete', removeCew);
router.post('/updateElo', updateElo);

module.exports = router;

function addCew(req, res, next) {
  if (!userService.isAdmin(req)) {
    res.status(403);
    return;
  }
  dataService.addCrew(req.body)
    .then((ok) => {
      res.sendStatus(200);
    })
    .catch(err => next(err));
}

function renameCew(req, res, next) {
  if (!userService.isAdmin(req)) {
    res.status(403);
    return;
  }
  dataService.renameCrew(req.body)
    .then((ok) => {
      res.sendStatus(200);
    })
    .catch(err => next(err));
}

function updateElo(req, res, next) {
  if (!userService.isAdmin(req)) {
    res.status(403);
    return;
  }
  dataService.updateTeamElo(req.body)
    .then((ok) => {
      res.sendStatus(200);
    })
    .catch(err => next(err));
}

function removeCew(req, res, next) {
  if (!userService.isAdmin(req)) {
    res.status(403);
    return;
  }
  dataService.removeCrew(req.body)
    .then((ok) => {
      res.sendStatus(200);
    })
    .catch(err => next(err));
}
const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const dataService = require('../services/data.service');

// routes
router.get('/', async (req, res, next) => {
  return await getHistory(req, res, next)
});
router.post('/removeMatch', async (req, res, next) => {
  return await removeMatch(req, res, next, false);
});
router.post('/removeMatchSimulation', async (req, res, next) => {
  return await removeMatch(req, res, next, true);
});
router.post('/updateMatch', async (req, res, next) => {
  return await updateMatch(req, res, next, false);
});
router.post('/updateMatchSimulation', async (req, res, next) => {
  return await updateMatch(req, res, next, true);
});

router.get('/sanityCheck', async (req, res, next) => {
  return await sanityCheck(req, res, next, true);
});

module.exports = router;

function sanityCheck(req, res, next) {
  var crew = req.query.crew;
  dataService.sanityCheckByCrew(crew).then(data => {
    res.send(data);
  });
}

function getHistory(req, res, next) {
  if (!userService.isLogged(req)) {
    res.sendStatus(403);
  }
  var crew = req.query.crew;
  var forced = req.query.forced || false;
  if (crew && crew != undefined) {
    dataService.getMatchHistoryByCrew(crew, forced)
      .then(data => {
        if (data) {
          res.json(data);
        } else {
          res.sendStatus(500);
        }
      }).catch(err => next(err));
  } else {
    dataService.getMatchHistory(forced)
      .then(data => {
        if (data) {
          res.json(data);
        } else {
          res.sendStatus(500);
        }
      }).catch(err => next(err));
  }
}

function removeMatch(req, res, next, simulateOnly) {
  if (!userService.isLogged(req)) {
    res.sendStatus(403);
  }
  var data = req.body;
  var winner = data.winnerTeam;
  var loser = data.loserTeam;
  var date = new Date(data.date);
  if (winner && loser && date) {
    dataService.removeMatch(date, winner, loser, simulateOnly)
      .then((data) => {
        if (data) {
          res.json(data);
        } else {
          res.json({});
        }
      }).catch(err => next(err));
  }
}

function updateMatch(req, res, next, simulateOnly) {
  if (!userService.isLogged(req)) {
    res.sendStatus(403);
  }
  var data = req.body;
  var matchData = {
    "original": {
      "date": new Date(data.date_original),
      "winner": data.winnerTeam_original,
      "loser": data.loserTeam_original,
      "stockDiff": parseInt(data.stockDiff_original),
    },
    "updated": {
      "date": new Date(data.date),
      "winner": data.winnerTeam,
      "loser": data.loserTeam,
      "stockDiff": parseInt(data.stockDiff),
    }
  }
  if (isValidMatch(matchData.original) && isValidMatch(matchData.updated)) {
    dataService.updateMatch(matchData, simulateOnly)
      .then((data) => {
        if (data) {
          res.json(data);
        } else {
          res.json({});
        }
      }).catch(err => next(err));
  }
}

function isValidMatch(matchData) {
  return (matchData.date && matchData.winner && matchData.loser && matchData.stockDiff>=0)
}


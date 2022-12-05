
const config = require('./config.service.js').getConfig();
const sheetId = config.standingsSheetId;
const googleSheet = require('./googlesheet.service');
const utils = require('./utils.service');

var doc = null;
var tableData = null;
var historyData = null;
var monthsShort = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
];

var historyCols = {
    date: 0,
    winner: 1,
    winnerELO: 2,
    winnerRank: 3,
    winnerIncrease: 4,
    winnerUpset: 5,
    loser: 6,
    loserELO: 7,
    loserRank: 8,
    stockDiff: 9,
    winnerPosition: 10,
    loserPosition: 11,
    matchType: 14
}
var rankCols = {
    crewTag: 1,
}
var crewInfoCols = {
    crewTag: 1,
}
function formatDate(date) {
    var d = date.getDate();
    d = (d < 10 ? '0' : '') + d;
    return monthsShort[date.getMonth()] + ", " + d + " " + date.getFullYear();
}

module.exports = {
    getScoreBoard,
    getMatchHistory,
    addMatch,
    addTeamMatch,
    addCrew,
    removeMatch,
    updateMatch,
    sanityCheckByCrew,
    renameCrew,
    removeCrew,
    updateTeamElo
};

async function getScoreBoard(forced) {
    if (forced === "true" || doc == null) {
        tableData = null;
        await loadDocument();
    }
    try {
        if (tableData == null) {
            tableData = await getSpreadSheedData();
        }
        return tableData;
    } catch (ex) {
        doc = null;
    }
    return null;
}

async function getMatchHistoryByCrew(crew, forced) {
    var crewData = null;
    try {
        var data = await getMatchHistory(forced);
        crewData = getHistoryByCrew(crew, data)
    } catch (ex) {
        doc = null;
    }
    return crewData;
}

async function sanityCheckByCrew(crew) {
    var data = await getMatchHistoryByCrew(crew, "true");
    if (!data) {
        return "";
    }
    var expectedELO = null;
    var result = "<html>";
    for (var row of data.sort(function (a, b) {
        return new Date(a[historyCols.date]) - new Date(b[historyCols.date]);
    })) {
        result = result + "------------------------------------------------------------<br>";
        result = result + "Date: " + row[historyCols.date] + "<br>";
        result = result + "Increase: " + row[historyCols.winnerIncrease] + "<br>";
        result = result + "Winer: " + row[historyCols.winner] + " ELO: " + row[historyCols.winnerELO] + "<br>";
        result = result + "Loser: " + row[historyCols.loser] + " ELO: " + row[historyCols.loserELO] + "<br>";
        var elo = 0;
        if (row[historyCols.winner].indexOf(" " + crew.trim() + " ") >= 0) {
            elo = parseInt(row[historyCols.winnerELO]);
        } else if (row[historyCols.loser].indexOf(" " + crew.trim() + " ") >= 0) {
            elo = parseInt(row[historyCols.loserELO]);
        }
        if (expectedELO && elo !== expectedELO) {
            result = result + "**************************************************" + "<br>";
            result = result + "ERROR: " + crew + " expected ELO " + expectedELO + " but got " + elo + "<br>";
            result = result + "**************************************************" + "<br>";
        }
        var increase = parseInt(row[historyCols.winnerIncrease])
        if (row[historyCols.winner].indexOf(" " + crew.trim() + " ") >= 0) {
            if (row[historyCols.matchType] !== "") {
                expectedELO = elo + increase;
            } else {
                expectedELO = parseInt(row[historyCols.winnerELO]) + increase;
            }
        } else if (row[historyCols.loser].indexOf(" " + crew.trim() + " ") >= 0) {
            if (row[historyCols.matchType] !== "") {
                expectedELO = elo - increase;
            } else {
                expectedELO = parseInt(row[historyCols.loserELO]) - increase;
            }
        }
    }
    result = result + "</html>";
    console.log(result);
    return result;
}

async function getMatchHistory(forced) {
    if (forced === "true" || doc == null) {
        historyData = null;
        await loadDocument();
    }
    try {
        if (historyData == null) {
            historyData = await getSpreadSheedHistoryData();
        }
        return historyData;
    } catch (ex) {
        doc = null;
    }
    return null;
}

async function addCrew(data) {
    if (doc == null) {
        await loadDocument();
    }
    var rankSheet = await doc.sheetsByIndex[0];
    var row = {
        "#": "_",
        "Tag": data.crewTag.toUpperCase(),
        "Crew": data.crewName,
        "Win Offset": 0,
        "Lose Offset": 0,
        "Elo Offset": 0
    }
    var rows = [];
    rows.push(row);
    try {
        await rankSheet.addRows(rows);
        tableData = null;
        historyData = null;
        return true;
    } catch (ex) {
        doc = null;
        return false;
    }
}

async function addMatch(data) {
    if (doc == null) {
        await loadDocument();
    }
    var historySheet = await doc.sheetsByIndex[1];
    var today = formatDate(new Date(Date.now()));
    var row = {
        "Date": data.matchDate || today,
        "Winner": " " + data.winnerTeam + " ",
        "WinnerELO": data.winnerTeamELO,
        "WinnerRank": data.winnerTeamRank,
        "WinnerIncrease": data.winnerTeamIncrease,
        "WinnnerUpset": data.winnerTeamUpset,
        "Loser": " " + data.loserTeam + " ",
        "LoserELO": data.loserTeamELO,
        "LoserRank": data.loserTeamRank,
        "StockDiff": data.stockDiff,
        "WinnerPosition": data.winnerTeamPosition,
        "LoserPosition": data.loserTeamPosition
    };
    console.log(JSON.stringify(row));
    var rows = [];
    rows.push(row);

    try {
        await historySheet.addRows(rows);
        doc = null;
        tableData = null;
        historyData = null;
        return true;
    } catch (ex) {
        doc = null;
        return false;
    }
}

async function updateTeamElo(data) {
    if (doc == null) {
        await loadDocument();
    }
    var historySheet = await doc.sheetsByIndex[1];
    var today = formatDate(new Date(Date.now()));
    var row = {
        "Date": today,
        "Winner": " " + data.team + " ",
        "WinnerELO": data.elo,
        "WinnerIncrease": data.eloIncrease,
        "Loser": " - ",
        "LoserELO": 0,
        "Comment": "Elo Adjustment from " + (data.elo - data.eloIncrease) + " to " + data.elo
    };
    console.log(JSON.stringify(row));
    var rows = [];
    rows.push(row);

    try {
        await historySheet.addRows(rows);
        doc = null;
        tableData = null;
        historyData = null;
        return true;
    } catch (ex) {
        doc = null;
        return false;
    }
}

async function addTeamMatch(data) {
    if (doc == null) {
        await loadDocument();
    }
    var historySheet = await doc.sheetsByIndex[1];
    var today = formatDate(new Date(Date.now()));
    var loserTeamItems = safeJoin(data.loserTeam);
    var winnerTeamItems = safeJoin(data.winnerTeam);
    var loserMVPItems = safeJoin(data.loserMVPS);

    var losersMVProw = {
        "Date": data.matchDate || today,
        "Winner": loserMVPItems,
        "Loser": "",
        "WinnerIncrease": 5,
        "Comment": "Loser MVPs",
        "MatchType": "Team",
        "WinnerTeam": winnerTeamItems,
        "LoserTeam": loserTeamItems
    };
    var losersRow = {
        "Date": data.matchDate || today,
        "Winner": "",
        "Loser": loserTeamItems,
        "WinnerIncrease": 0,
        "Comment": "Losers",
        "MatchType": "Team",
        "WinnerTeam": winnerTeamItems,
        "LoserTeam": loserTeamItems,
    };
    var rows = [];
    for (var winner of data.winnerTeam) {
        var crewIndex = data.winnerTeam.indexOf(winner);
        var score = parseInt(data.winnerScores[crewIndex]);
        if (data.winnerMVPS.indexOf(winner) >= 0) {
            score = score + 5;
        }
        var winnerrow = {
            "Date": data.matchDate || today,
            "Winner": " " + winner + " ",
            "WinnerIncrease": score,
            "Comment": "Winner Team",
            "MatchType": "Team",
            "WinnerTeam": winnerTeamItems,
            "LoserTeam": loserTeamItems
        };
        rows.push(winnerrow);
    }
    rows.push(losersMVProw);
    rows.push(losersRow);

    try {
        await historySheet.addRows(rows);
        doc = null;
        tableData = null;
        historyData = null;
        return true;
    } catch (ex) {
        doc = null;
        return false;
    }
}

function safeJoin(array) {
    if (Array.isArray(array)) {
        return " " + array.join(" ") + " "
    } else {
        return " " + array + " ";
    }
}

function getHistoryByCrew(crew, history) {
    var data = [];
    if (!history || !history.data) {
        return data;
    }
    for (var row of history.data) {
        if (row[historyCols.winner].indexOf(" " + crew.trim() + " ") >= 0 || row[historyCols.loser].indexOf(" " + crew.trim() + " ") >= 0) {
            data.push(row);
        }
    }
    return data;
}

async function removeMatch(date, winner, loser, simulateOnly) {
    if (doc == null) {
        await loadDocument();
    }
    var affectedCrews = [];
    var sheet = await doc.sheetsByIndex[1];
    var rows = await sheet.getRows();
    var rowSet = rows.filter(row => {
        var isOnRange = (parseDate(getValue(row, historyCols.date)).getTime() >= date.getTime());
        var isRegularMatch = (row.MatchType !== "Team");
        return (isOnRange && isRegularMatch);
    });
    var rowToDelete = getMatchRow(rowSet, date, winner, loser);
    var baseIndex = rowSet.indexOf(rowToDelete);
    affectedCrews.push({
        "elo": getIntValue(rowToDelete, historyCols.winnerELO),
        "tag": getValue(rowToDelete, historyCols.winner)
    });
    affectedCrews.push({
        "elo": getIntValue(rowToDelete, historyCols.loserELO),
        "tag": getValue(rowToDelete, historyCols.loser)
    });
    var rowsToUpdate = await getRowsToUpdate(affectedCrews, rowSet, baseIndex);
    var result = null;
    try {
        if (!simulateOnly) {
            await sheet.loadCells();
        }
        result = await updateAffectedRows(sheet, affectedCrews, rowsToUpdate, simulateOnly);
        if (!simulateOnly) {
            await rowToDelete.delete();
        }
    } catch (ex) {

    }
    var retVal = {
        delete: [],
        update: [],
        insert: []
    }
    retVal.delete.push(parseRow(rowToDelete));
    retVal.update = result;
    return retVal;
}

async function updateMatch(matchData, simulateOnly) {
    if (doc == null) {
        await loadDocument();
    }
    var affectedCrews = [];
    var sheet = await doc.sheetsByIndex[1];
    var rows = await sheet.getRows();
    var original = matchData.original;
    var updated = matchData.updated;
    var rowSet = rows.filter(row => {
        var isOnRange = (parseDate(getValue(row, historyCols.date)).getTime() >= original.date.getTime());
        var isRegularMatch = (row.MatchType !== "Team");
        return (isOnRange && isRegularMatch);
    });
    var rowToUpdate = getMatchRow(rowSet, original.date, original.winner, original.loser, original.stockDiff);
    var winnerElo = getIntValue(rowToUpdate, historyCols.winnerELO);
    var loserElo = getIntValue(rowToUpdate, historyCols.loserELO);
    if (original.winner != updated.winner) {
        //Swapped
        var temp = winnerElo;
        winnerElo = loserElo;
        loserElo = temp;
    }
    var result = utils.getMatchResult(winnerElo, loserElo, updated.stockDiff);
    var baseIndex = rowSet.indexOf(rowToUpdate) + 1;

    affectedCrews.push({
        "elo": winnerElo + result.elo,
        "tag": updated.winner
    });
    affectedCrews.push({
        "elo": loserElo - result.elo,
        "tag": updated.loser
    });


    var rowsToUpdate = await getRowsToUpdate(affectedCrews, rowSet, baseIndex);
    if (!simulateOnly) {
        await sheet.loadCells();
        setCellValue(sheet, rowToUpdate.rowNumber, historyCols.winner, updated.winner);
        setCellValue(sheet, rowToUpdate.rowNumber, historyCols.winnerELO, winnerElo);
        setCellValue(sheet, rowToUpdate.rowNumber, historyCols.loser, updated.loser);
        setCellValue(sheet, rowToUpdate.rowNumber, historyCols.loserELO, loserElo);
        setCellValue(sheet, rowToUpdate.rowNumber, historyCols.stockDiff, updated.stockDiff);
        setCellValue(sheet, rowToUpdate.rowNumber, historyCols.winnerIncrease, result.elo);
        setCellValue(sheet, rowToUpdate.rowNumber, historyCols.winnerUpset, result.upset);
    } else {
        var inc = getValue(rowToUpdate, historyCols.winnerIncrease);
        var upset = getValue(rowToUpdate, historyCols.winnerUpset);
        var o_winnerElo = getValue(rowToUpdate, historyCols.winnerELO);
        var o_loserElo = getValue(rowToUpdate, historyCols.loserELO);
        setValue(rowToUpdate, historyCols.stockDiff, original.stockDiff + " -> " + updated.stockDiff);
        setValue(rowToUpdate, historyCols.winner, original.winner + " -> " + updated.winner);
        setValue(rowToUpdate, historyCols.winnerELO, o_winnerElo + " -> " + winnerElo);
        setValue(rowToUpdate, historyCols.loser, original.loser + " -> " + updated.loser);
        setValue(rowToUpdate, historyCols.loserELO, o_loserElo + " -> " + loserElo);
        setValue(rowToUpdate, historyCols.winnerIncrease, inc + " -> " + result.elo);
        setValue(rowToUpdate, historyCols.winnerUpset, upset + " -> " + result.upset);
    }
    var result = null;
    try {
        result = await updateAffectedRows(sheet, affectedCrews, rowsToUpdate, simulateOnly);
        var data = parseRow(rowToUpdate);
        data.date = formatDateStr(data.date);
        if (result != null) {
            result.unshift(data);
        }
    } catch (ex) {

    }
    var retVal = {
        delete: [],
        update: [],
        insert: []
    }
    retVal.update = result
    return retVal;
}

async function updateAffectedRows(sheet, affectedCrews, rowsToUpdate, simulateOnly) {
    if (simulateOnly) {
        var simulatedData = [];
        simulateEloUpdate(rowsToUpdate, affectedCrews);
        for (var row of rowsToUpdate) {
            var data = parseRow(row);
            data.date = formatDateStr(data.date);
            simulatedData.push(data);
        }
        return simulatedData;
    } else {
        try {
            processEloUpdate(sheet, rowsToUpdate, affectedCrews);
            await sheet.saveUpdatedCells();
        } catch (ex) {
            doc = null;
        }
        return null;
    }
}

async function getRowsToUpdate(affectedCrews, rowSet, baseIndex) {
    var rowsToUpdate = [];
    for (var row of rowSet) {
        if (rowSet.indexOf(row) < baseIndex) {
            continue;
        }
        var matchWinner = getValue(row, historyCols.winner);
        var matchLoser = getValue(row, historyCols.loser);
        var containsWinner = affectedCrews.findIndex(row => row.tag == matchWinner) >= 0;
        var containsLoser = affectedCrews.findIndex(row => row.tag == matchLoser) >= 0;

        if (containsWinner || containsLoser) {
            rowsToUpdate.push(row);
            if (!containsWinner) {
                affectedCrews.push({
                    "elo": getIntValue(row, historyCols.winnerELO),
                    "tag": matchWinner
                });
            }
            if (!containsLoser) {
                affectedCrews.push({
                    "elo": getIntValue(row, historyCols.loserELO),
                    "tag": matchLoser
                });
            }
        }
    }
    return rowsToUpdate;
}

function parseRow(row) {
    var item = {}
    for (var key in historyCols) {
        var index = historyCols[key];
        item[key] = row._rawData[index];
    }
    return item;
}

function getValue(row, index) {
    if (row != null) {
        return row._rawData[index];
    } else {
        return null;
    }
}
function getIntValue(row, index) {
    return parseInt(getValue(row, index));
}

function setValue(row, index, value) {
    row._rawData[index] = value;
}
function setCellValue(sheet, rowIndex, colIndex, value) {
    var cell = sheet.getCell(rowIndex - 1, colIndex);
    cell.value = value;
}

function processEloUpdate(sheet, affectedRows, affectedCrews) {
    for (var row of affectedRows) {
        var winnerTag = getValue(row, historyCols.winner);
        var loserTag = getValue(row, historyCols.loser);
        var winnerPrevious = affectedCrews.find(row => row.tag == winnerTag);
        var loserPrevious = affectedCrews.find(row => row.tag == loserTag);
        setCellValue(sheet, row.rowNumber, historyCols.winnerELO, winnerPrevious.elo);
        setCellValue(sheet, row.rowNumber, historyCols.loserELO, loserPrevious.elo);
        var result = utils.getMatchResult(getIntValue(row, historyCols.winnerELO), getIntValue(row, historyCols.loserELO), getIntValue(row, historyCols.stockDiff));
        setCellValue(sheet, row.rowNumber, historyCols.winnerUpset, result.upset);
        setCellValue(sheet, row.rowNumber, historyCols.winnerIncrease, result.elo);
        winnerPrevious.elo = winnerPrevious.elo + result.elo;
        loserPrevious.elo = loserPrevious.elo - result.elo;
    }
}

function simulateEloUpdate(affectedRows, affectedCrews) {
    for (var row of affectedRows) {
        var winnerTag = getValue(row, historyCols.winner);
        var loserTag = getValue(row, historyCols.loser);
        var winnerPrevious = affectedCrews.find(row => row.tag == winnerTag);
        var loserPrevious = affectedCrews.find(row => row.tag == loserTag);
        setValue(row, historyCols.winnerELO, getValue(row, historyCols.winnerELO) + " -> " + winnerPrevious.elo);
        setValue(row, historyCols.loserELO, getValue(row, historyCols.loserELO) + " -> " + loserPrevious.elo);
        var result = utils.getMatchResult(getIntValue(row, historyCols.winnerELO), getIntValue(row, historyCols.loserELO), getIntValue(row, historyCols.stockDiff));
        setValue(row, historyCols.winnerUpset, getValue(row, historyCols.winnerUpset) + " -> " + result.upset);
        setValue(row, historyCols.winnerIncrease, getValue(row, historyCols.winnerIncrease) + " -> " + result.elo);
        winnerPrevious.elo = winnerPrevious.elo + result.elo;
        loserPrevious.elo = loserPrevious.elo - result.elo;
    }
}

function getMatchRow(historyRows, date, winner, loser, stockDiff) {
    var time = date.getTime();
    if (!stockDiff) {
        for (var row of historyRows) {
            if (getValue(row, historyCols.winner) === winner && getValue(row, historyCols.loser) === loser && Date.parse(parseDate(getValue(row, historyCols.date))) === time) {
                return row;
            }
        }
    }
    for (var row of historyRows) {
        if (getIntValue(row, historyCols.stockDiff) === stockDiff && getValue(row, historyCols.winner) === winner && getValue(row, historyCols.loser) === loser && Date.parse(parseDate(getValue(row, historyCols.date))) === time) {
            return row;
        }
    }
    return null;
}

async function loadDocument() {
    doc = await googleSheet.getDocument(sheetId);
}

async function renameCrew(data) {
    if (doc == null) {
        await loadDocument();
    }
    var oldTag = data.oldTag;
    var oldName = data.oldName;
    var newTag = data.newTag;
    var newName = data.newName;

    var rankRows = 900;
    var historyRows = 900;
    var crewInfoRows = 900;

    var rankSheet = await doc.sheetsByIndex[0];
    var historySheet = await doc.sheetsByIndex[1];
    var crewInfoSheet = await doc.sheetsByIndex[2];
    try {
        await rankSheet.loadCells("B2:C" + rankRows + 2);
        for (var i = 1; i < rankRows; i++) {
            var tagCell = rankSheet.getCell(i, 1);
            replaceValue(tagCell, oldTag, newTag);
            var nameCell = rankSheet.getCell(i, 2);
            replaceValue(nameCell, oldName, newName);
        }
        await historySheet.loadCells("B2:P" + historyRows + 2)
        for (var i = 1; i < historyRows; i++) {
            var winnerCell = historySheet.getCell(i, 1);
            replaceValue(winnerCell, " " + oldTag + " ", " " + newTag + " ");
            var loserCell = historySheet.getCell(i, 6);
            replaceValue(loserCell, " " + oldTag + " ", " " + newTag + " ");
            var winnerCell = historySheet.getCell(i, 14);
            replaceValue(winnerCell, " " + oldTag + " ", " " + newTag + " ");
            var loserCell = historySheet.getCell(i, 15);
            replaceValue(loserCell, " " + oldTag + " ", " " + newTag + " ");
        }
        await crewInfoSheet.loadCells("A2:B" + crewInfoRows + 2);
        for (var i = 1; i < crewInfoRows; i++) {
            var tagCell = crewInfoSheet.getCell(i, 0);
            replaceValue(tagCell, oldName, newName);
            var nameCell = crewInfoSheet.getCell(i, 1);
            replaceValue(nameCell, oldTag, newTag);
        }
        await rankSheet.saveUpdatedCells();
        await historySheet.saveUpdatedCells();
        await crewInfoSheet.saveUpdatedCells();
        return true;
    } catch (ex) {
        doc = null;
        return false;
    }
}

async function removeCrew(data) {
    if (doc == null) {
        await loadDocument();
    }
    var crewTag = data.crewTag;

    var rankRows = 900;
    var historyRows = 900;
    var crewInfoRows = 900;

    var rankSheet = await doc.sheetsByIndex[0];
    var historySheet = await doc.sheetsByIndex[1];
    var crewInfoSheet = await doc.sheetsByIndex[2];
    try {
        var rankRows = await rankSheet.getRows();
        var crewToDelete = rankRows.filter(row => {
            return (getValue(row, rankCols.crewTag) === crewTag)
        });
        if (!crewToDelete || crewToDelete.length == 0) {
            return false;
        }
        var newTag = crewTag + "[DELETED]";
        await historySheet.loadCells("B2:P" + historyRows + 2)
        for (var i = 1; i < historyRows; i++) {
            var winnerCell = historySheet.getCell(i, 1);
            replaceValue(winnerCell, " " + crewTag + " ", " " + newTag + " ");
            var loserCell = historySheet.getCell(i, 6);
            replaceValue(loserCell, " " + crewTag + " ", " " + newTag + " ");
            var winnerCell = historySheet.getCell(i, 14);
            replaceValue(winnerCell, " " + crewTag + " ", " " + newTag + " ");
            var loserCell = historySheet.getCell(i, 15);
            replaceValue(loserCell, " " + crewTag + " ", " " + newTag + " ");
        }
        var crewInfoRows = await crewInfoSheet.getRows();
        var crewInfoToDelete = crewInfoRows.filter(row => {
            return (getValue(row, crewInfoCols.crewTag) === crewTag)
        });
        if (crewInfoToDelete && crewInfoToDelete.length > 0) {
            crewInfoToDelete[0].delete();
        }
        crewToDelete[0].delete();
        await historySheet.saveUpdatedCells();
        return true;
    } catch (ex) {
        doc = null;
        return false;
    }
}

function replaceValue(row, oldValue, newValue) {
    var value = row.value;
    if (value && value.indexOf(oldValue) > -1) {
        var newValue = value.replace(oldValue, newValue);
        row.value = newValue;
    }
}

async function getSpreadSheedHistoryData() {
    var dataSet = await googleSheet.getSpreadSheedData(doc, 1);
    dataSet = await formatHistoryData(dataSet);
    return dataSet;
}

async function getSpreadSheedData() {
    var dataSet = await googleSheet.getSpreadSheedData(doc, 0, function (dataRow) {
        return (dataRow[0] !== "")
    });
    return dataSet;
}

async function formatHistoryData(dataSet) {
    if (dataSet.data) {
        for (var row of dataSet.data) {
            var firstStr = parseInt(row[1].toString()[0]);
            var date = null;
            if (isNaN(firstStr)) {
                date = new Intl.DateTimeFormat('en-GB').format(new Date(row[1]));
            } else {
                date = row[1];
            }
            if (date.indexOf("/") >= 0) {
                var dateParts = date.split("/");
                var dateStr = dateParts[2].padStart(2, '0') + "-" + dateParts[1].padStart(2, '0') + "-" + dateParts[0].padStart(2, '0');
            } else {
                dateStr = date;
            }
            row[1] = dateStr;
        }
    }
    return dataSet;
}

function formatDateStr(date) {
    if (date.indexOf("/") >= 0) {
        var dateParts = date.split("/");
        var dateStr = dateParts[0].trim().padStart(2, '0') + "/" + dateParts[1].trim().padStart(2, '0') + "/" + dateParts[2].trim().padStart(2, '0');
        return dateStr;
    }
    return date;
}

function parseDate(date) {
    if (date.indexOf("/") >= 0) {
        var dateParts = date.split("/");
        var dateStr = dateParts[2].trim().padStart(2, '0') + "-" + dateParts[1].trim().padStart(2, '0') + "-" + dateParts[0].trim().padStart(2, '0');
        return new Date(dateStr);
    } else {
        return new Date(date);
    }
}
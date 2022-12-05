const tableId = "table-container";
const historyTableId = "historytable-container";
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
var loadingHistory = false;
var loadingStandings = false;

window.scorebot = {
    standingsData: null,
    standingsLoaded: new observable(false),
    historyData: null,
    historyLoaded: new observable(false),
    crews: {},
    crewsData: {},
    crewsLoaded: new observable(false),
    batchData: [],
    plugins: {},
    batchCols: {
        rowId: 0,
        winner: 1,
        loser: 2,
        eloIncrease: 3,
        date: 6
    },
    standingsCols: {
        rowid: 0,
        position: 1,
        tag: 2,
        name: 3,
        wins: 4,
        losses: 5,
        elo: 6,
        rank: 7,
        winOffset: 8,
        loseOffset: 9,
        eloOffset: 10,
        winnerTag: 11,
        loserTag: 12,
        winnerIncrease: 13,
        lastMatchDate: 14,
        winnerRank: 15,
        loserRank: 16,
        winnerPosition: 17,
        loserPosition: 18,
    },
    historyCols: {
        id: 0,
        date: 1,
        winnerTag: 2,
        winnerElo: 3,
        winnerPosition: 4,
        winnerIncrease: 5,
        winnerUpset: 6,
        loserTag: 7,
        loserElo: 8,
        loserRank: 9,
        stockDiff: 10,
        winnerPosition: 11,
        loserPosition: 12,
        matchType: 14,
        winnerTeam: 15,
        loserTeam: 16
    }
}
var standingCols = window.scorebot.standingsCols;
var historyCols = window.scorebot.historyCols;

var dataOptions = {
    columns: [
        {
            col: 0,
            colType: "hidden"
        },
        {
            col: 1,
            colType: "numeric",
            class: "center"
        },
        {
            col: 2,
            onRenderCell: renderRanking
        },
        {
            col: 3,
            class: "hide-on-med-and-down"
        }
    ],
    pagingContainer: ".datatable-paging",
    usePaging: true,
    onCellClick: onCellClick
};

var historyDataOptions = {
    columns: [
        {
            col: 0,
            colType: "date",
            onRenderCell: renderDate
        }
    ],
    onRenderRow: renderHistoryRow,
    onCellClick: onHistoryCellClick,
    usePaging: false
};

var crewInfoModal = {};
window.scorebot.historyRowSelected = {};

$(document).ready(function () {
    M.AutoInit();
    extendDropDown();
    var adminOptions = document.getElementById("adminOptionsDropdown");
    M.Dropdown.init(adminOptions, {
        constrainWidth: false,

    });
    M.FloatingActionButton.init(document.querySelectorAll('.fixed-action-btn'), {
        direction: 'left'
    });

    reloadFullData(false);

    var crewInfoModalEl = document.getElementById("crew-info");
    crewInfoModal = M.Modal.init(crewInfoModalEl, {
        dismissible: true
    });
    $(".modal-close").on("click", function () {
        if (crewInfoModal) {
            crewInfoModal.close();
        }
    });
    var validations = $(".validate");
    for (var validation of validations) {
        $(validation).on("blur", function () { validateField(this) });
    }
    $(".js-updata-datasource").on("click", function () {
        reloadFullData(true);
    });
    $('.js-nav').on("click", function () {
        $(this).parent().find('.menu').toggleClass('active');
    });
    $("#crew-info-elo").on("change", function () {
        $("#crew-info-elo").removeClass("s12").addClass("s9");
        $("#crew-update-elo").removeClass("hidden");
    });
    $("#crew-update-elo").on("click", function () {
        updateCrewElo();
        $("#crew-info-elo").removeClass("s9").addClass("s12");
        $("#crew-update-elo").addClass("hidden");
    })
    var scoreBotReadyEvent = new CustomEvent("scoreBotReady");
    window.dispatchEvent(scoreBotReadyEvent);
    window.scorebot.ready = true;
});
function log(text){
    console.log("[SCOREBOT] "+text);
}
function updateCrewElo() {
    if (window.scorebot.crewSelected) {
        var oldElo = parseInt(window.scorebot.crewSelected.ELO);
        var newElo = parseInt($("#crew-info-elo").val());
        var crewElo = $("#crew-info-elo");
        if (confirm("You're about to update " + window.scorebot.crewSelected.Name + " Team ELO, Old Elo: " + oldElo + " New Elo: " + newElo + ", are you sure?")) {
            postData("/crew/updateElo", {
                "team": window.scorebot.crewSelected.Tag,
                "elo": newElo,
                "eloIncrease": (newElo - oldElo)
            },function () {
                window.scorebot.crewSelected.ELO = newElo;
                loadStandingsData(true);
                alert("Elo Updated correctly.");
            },function () {
                window.scorebot.crewSelected.ELO = oldElo;
                crewElo.val(oldElo);
                alert("There were problems updating the ELO, please try again later.");
            });
        }else{
            crewElo.val(oldElo);
        }
    }
}

function renderDate(row, column, cell, cellValue, rowValue) {
    if (cellValue) {
        var date = new Date(cellValue);
        if (date) {
            var d = date.toISOString().split("T")[0];
            var datePart = d.split("-");
            cell.innerHTML = datePart[2] + "/" + datePart[1] + "/" + datePart[0];
        }
    }
}

function onHistoryCellClick(row, col, data, rowData) {
    window.scorebot.historyRowSelected = rowData;
}

function reloadFullData(forced) {
    loadStandingsData(forced);
    loadHistoryData(forced);
}

function renderRanking(row, column, cell, cellValue, rowValue) {
    var currentPosition = parseInt(rowValue[standingCols.position]);
    var currentRank = getRankFromELO(rowValue[standingCols.elo]);
    var previousPosition = null;
    var previousRank = null;

    var wasWinner = (rowValue[standingCols.tag] === rowValue[standingCols.winnerTag]);
    if (wasWinner) {
        previousPosition = parseInt(rowValue[standingCols.winnerPosition]);
        previousRank = parseInt(rowValue[standingCols.winnerRank]);
    } else {
        previousPosition = parseInt(rowValue[standingCols.loserPosition]);
        previousRank = parseInt(rowValue[standingCols.loserRank]);
    }
    var positionDiv = getPositionIcon(previousPosition, currentPosition);
    var rankDiv = getRankIcon(previousRank, currentRank);
    var $cell = $(cell);
    var $cellData = $("<div class='flex-center cell-data'>" + cellValue + "</div>");
    if (positionDiv) {
        var $positionDiv = $(positionDiv);
        $cellData.append($positionDiv);
        setTimeout(() => {
            $positionDiv.css('opacity', 1);
        }, 0);
    }
    if (rankDiv) {
        var $rankDiv = $(rankDiv);
        $cellData.append($rankDiv);
        $cellData.append(positionDiv);
        setTimeout(() => {
            $rankDiv.css('opacity', 1);
        }, 0);
    }
    $cell.append($cellData);
}

function getPositionIcon(previousPosition, currentPosition) {
    var positionDiv = null;
    if (!previousPosition || !currentPosition || isNaN(previousPosition) || isNaN(currentPosition)) {
        return null;
    }
    if (previousPosition && previousPosition > currentPosition) {
        positionDiv = "<span class='material-icons rank-icon rank-up'>arrow_upward</span>"
    } else if (previousPosition && previousPosition < currentPosition) {
        positionDiv = "<span class='material-icons rank-icon rank-down'>arrow_downward</span>"
    } else if (previousPosition && previousPosition === currentPosition) {
        positionDiv = "<span class='material-icons rank-icon rank-same'>remove</span>"
    }
    return positionDiv;
}

function getRankIcon(previousRank, currentRank) {
    var rankDiv = null;
    if (!previousRank || !currentRank || isNaN(previousRank) || isNaN(currentRank)) {
        return null;
    }
    if (previousRank && previousRank < currentRank) {
        rankDiv = "<span class='material-icons rank-icon rank-up rotate-left'>double_arrow</span>"
    } else if (previousRank && previousRank > currentRank) {
        rankDiv = "<span class='material-icons rank-icon rank-down rotate-right'>double_arrow</span>"
    }
    return rankDiv;
}

function onCellClick(row, col, data, rowData) {
    var crewInfo = {};
    crewInfo["Position"] = rowData[standingCols.position] || "-";
    crewInfo["Tag"] = rowData[standingCols.tag] || "-";
    crewInfo["Name"] = rowData[standingCols.name] || "-";
    crewInfo["Wins"] = rowData[standingCols.wins] || "-";
    crewInfo["Losses"] = rowData[standingCols.losses] || "-";
    crewInfo["ELO"] = rowData[standingCols.elo] || "-";
    crewInfo["Rank"] = rowData[standingCols.rank] || "-";
    window.scorebot.crewSelected = crewInfo;
    renderCrewInfo(crewInfo);
    crewInfoModal.open();
}

function renderCrewInfo(crewInfo) {
    window.scorebot.historyRowSelected = null;
    var $container = $("#crew-info");
    for (var key in crewInfo) {
        if (key === "Name" || key === "Tag" || key === "Position") {
            $container.find("*[data-field='" + key + "']").text(crewInfo[key]);
        } else {
            $container.find("*[data-field='" + key + "']").val(crewInfo[key]);
        }
    }
    $container.find("label").addClass("active");
    loadHistoryData(false, crewInfo["Tag"]);
}

function loadStandingsData(forced) {
    log("Loading Standings Data");
    if (loadingStandings) {
        log("Standings Data is already loading... skipping request");
        return;
    }
    loadingStandings = true;
    $("#tableLoading").show();
    var f = 'false';
    if (forced === true) {
        f = 'true';
    }
    window.scorebot.standingsLoaded.setValue(false);
    window.scorebot.crewsLoaded.setValue(false);
    return fetch('/data?forced=' + f)
        .then(response => {
            log("[LoadStandingData] Processing response");
            processResponse(response).then(() => {
                log("[LoadStandingData] Rendering Data");
                $("#tableLoading").hide();
                $('#' + tableId).show();
                loadCrewData();
            });
            loadingStandings = false;
        })
        .catch(ex => {
            $("#tableLoading").hide();
            log("[LoadStandingData] ERROR: " + ex);
            alert("Ups! there was an error loading standings, error: " + ex);
            loadingStandings = false;
        });
}

function loadHistoryData(forced, crew) {
    log("Loading History Data");
    if (loadingHistory) {
        log("History Data is already loading, skipping request...");
        return;
    }
    if (window.scorebot.historyData && window.scorebot.historyData.length > 0 && crew && crew != undefined) {
        log("[LoadHistoryData] Filling History Table");
        fillHistoryTable(crew);
        return;
    }
    loadingHistory = true;
    window.scorebot.historyLoaded.setValue(false);
    var f = 'false';
    if (forced === true) {
        f = 'true';
    }
    return fetch('/history?forced=' + f)
        .then(response => {
            log("[LoadHistoryData] Processing response");
            processHistoryResponse(response, crew).then(() => {
                log("[LoadHistoryData] Rendering data");
                $("#historyTableLoading").hide();
                $('#' + historyTableId).show();
            });
            loadingHistory = false;
        })
        .catch(ex => {
            log("[LoadHistoryData] ERROR: "+ex);
            alert("Ups! there was an error loading history, error: " + ex);
            console.log("ERROR: " + ex);
            loadingHistory = false;
        });
}

function processResponse(response, table) {
    return response.json().then(data => {
        window.scorebot.standingsData = data.data;
        window.scorebot.standingsLoaded.setValue(true);
        if (window.scorebot.table) {
            window.scorebot.table.load(data.data);
        } else {
            dataOptions.data = data.data;
            window.scorebot.table = $('#' + tableId).dataTable(dataOptions, 1);
        }
    });
}

function processHistoryResponse(response, crew) {
    return response.json().then(data => {
        window.scorebot.historyData = data.data;
        window.scorebot.historyLoaded.setValue(true);
        if (!crew || crew === undefined) {
            return;
        }
        fillHistoryTable(crew);
    });
}

function fillHistoryTable(crew) {
    var crewData = [];
    if (window.scorebot.historyData) {
        var filteredData = window.scorebot.historyData.filter(x => x[historyCols.winnerTag].trim() === crew || x[historyCols.loserTag].trim() === crew
            || x[historyCols.winnerTag].indexOf(" " + crew + " ") >= 0);
        crewData = cloneArray(filteredData);
        crewData.forEach(row => {
            if (row[historyCols.matchType] == "Team") {
                row[historyCols.winnerTag] = row[historyCols.winnerTeam];
                row[historyCols.loserTag] = row[historyCols.loserTeam];
            } else {
                if (row[historyCols.winnerTag].trim() !== crew) {
                    row[historyCols.winnerIncrease] = row[historyCols.winnerIncrease] * -1;
                }
            }
        });
    }
    if (window.scorebot.historyTable) {
        window.scorebot.historyTable.load(crewData);
    } else {
        historyDataOptions.data = crewData;
        window.scorebot.historyTable = $('#' + historyTableId).dataTable(historyDataOptions, 0, "Descending");
    }
}

function renderHistoryRow(row, rowEl, data) {
    var elo = parseInt(data[5]);
    if (!isNaN(elo) && elo < 0) {
        rowEl.style.backgroundColor = "#654c4c";
    }
}

function cloneArray(source) {
    return source.map(function (arr) {
        return arr.slice();
    });
}

function serializeToDataArray($form) {
    var unindexed_array = $form.serializeArray();
    var indexed_array = [];

    $.map(unindexed_array, function (n, i) {
        indexed_array.push(n['value']);
    });

    return indexed_array;
}

function serializeToJson($form) {
    var unindexed_array = $form.serializeArray();
    var indexed_array = {};

    $.map(unindexed_array, function (n, i) {
        indexed_array[n['name']] = n['value'];
    });

    return indexed_array;
}

function resetForm(form) {
    var formEl = form;
    if (form.jquery) {
        formEl = form.get(0);
    }
    formEl.reset();
    M.updateTextFields();
}

function resetFormById(formId) {
    var form = $("#" + formId);
    resetForm(form.get(0));
}

function closeModal(id) {
    var elem = document.getElementById(id);
    var instance = M.Modal.getInstance(elem);
    if (instance) {
        instance.close();
    }
}

function manageFormSubmit(form, sumbitEl, url, completeCb, successCb, validationCb) {
    $(sumbitEl).on("click", function (e) {
        if (validationCb && !validationCb(form, sumbitEl)) {
            return false;
        }
        e.preventDefault();
        postData(url, form.serialize(), successCb, function (err) {
            console.log(err);
            alert("UPS! something went wrong! error: " + err);
        });
        var result = true;
        if (completeCb) {
            result = completeCb();
        }
        return result;
    });
}

function getField(container, name) {
    var el = $(container).find("[data-field='" + name + "'");
    if (el.length > 0) {
        return el;
    }
    return $(container).find("[name='" + name + "'");
}

function getFieldLabel(container, name) {
    var el = $(container).find("[data-field='" + name + "'");
    if (el.length > 0) {
        return el;
    }
    el = $(container).find("[name='" + name + "'");
    if (el) {
        return $(el).closest(".input-field").find("label");
    }
    return null;
}

function getRankFromELO(ELO) {
    if (ELO <= 1349) {
        return 1; //Bronze
    }
    if (ELO <= 1499) {
        return 2; //Silver
    }
    if (ELO <= 1749) {
        return 3;//Gold
    }
    if (ELO <= 1999) {
        return 4;//Platinum
    }
    if (ELO > 1999) {
        return 5;//Diamond
    }
}

function getRankName(rank) {
    if (rank === 1) {
        return "Bronze";
    }
    if (rank === 2) {
        return "Silver";
    }
    if (rank === 3) {
        return "Gold";
    }
    if (rank === 4) {
        return "Platinum";
    }
    if (rank === 5) {
        return "Diamond";
    }
}

function postData(url, formData, successCb, failCb, finallyCb) {
    $.ajax({
        type: "POST",
        url: url,
        data: formData
    })
        .done(function (data) {
            if (successCb) {
                successCb(data);
            }
        })
        .fail(function (xhr, textStatus, errorThrown) {
            alert("Ups! there was an error submitting data, error: " + ex);
            console.log(errorThrown);
            if (failCb) {
                failCb();
            }
        })
        .always(function () {
            if (finallyCb) {
                finallyCb();
            }
        });
}

function formatDate(date) {
    var d = date.getDate();
    d = (d < 10 ? '0' : '') + d;
    return monthsShort[date.getMonth()] + ", " + d + " " + date.getFullYear();
}

function validateField(input) {
    var validation = getValidation(input);
    if (validation(input)) {
        $(input).addClass("invalid");
        return false;
    } else {
        $(input).removeClass("invalid");
        return true;
    }
}

function validate(container) {
    var validations = container.find(".validate");
    var valid = true;
    for (var validation of validations) {
        if (!validateField(validation)) {
            valid = false;
        }
    }
    return valid;
}

function getValidation(validation) {
    var validations = $(validation).data("validation");
    if (!validations) {
        return dummyValidation;
    }
    var validationList = validations.split(' ');
    if (validationList.indexOf("notEmpty") >= 0) {
        return isEmpty;
    }
    return dummyValidation;
}

function isEmpty(input) {
    var val = $(input).val();
    return (!val || val.trim().length == 0);
}

function dummyValidation(input) {
    return true;
}

function toDataArray(item) {
    var columns = [];
    for (var key in item) {
        columns.push(item[key]);
    }
    return columns;
}

function extendDropDown() {
    var defaultGetDropdownPosition = M.Dropdown.prototype._getDropdownPosition;
    M.Dropdown.prototype._getDropdownPosition = function () {
        var footerOffset = 56;
        var dropDownPosition = defaultGetDropdownPosition.call(this);
        var elMaxHeight = parseInt(this.el.dataset.maxheight);
        var $el = $(this.el)
        var content = $el.closest(".content");
        if (elMaxHeight) {

            if (dropDownPosition.height != 0 && dropDownPosition.height > elMaxHeight) {
                dropDownPosition.height = elMaxHeight;
            }
        }
        if (content.length > 0) {

            var containerToffset = content.offset();
            var elOffset = $el.offset();

            var maxHeight = content.height() + containerToffset.top;
            var listHeight = elOffset.top + dropDownPosition.height;
            if (listHeight > (maxHeight - footerOffset)) {
                dropDownPosition.height = maxHeight - elOffset.top - footerOffset;
            }

        }
        return dropDownPosition;
    };
}

function loadCrewData() {
    var crews = {};
    log("initializing crew autocompletion");
    var crewName = window.scorebot.standingsCols.name;
    var crewColumn = window.scorebot.standingsCols.tag;
    for (var row of window.scorebot.standingsData) {
        var tag = row[crewColumn];
        var name = row[crewName];
        var position = row[1];
        crews[tag] = {
            "key": tag,
            "value": tag + " - " + name,
            "name": name,
            "position": position
        }
    }
    window.scorebot.crews = crews;
    window.scorebot.crewsLoaded.setValue(true);
}

function manageAutocompleteBlur(input, backingField, items, onAutocomplete) {
    if (!hasValidAutocompletion(input)) {
        var data = getFirstMatch(input, items);
        if (data) {
            $(input).val(items[data].value || data);
            if (onAutocomplete) {
                onAutocomplete(data, items[data], input);
            }
        } else {
            $(input).val("");
            $(backingField).val("");
        }
    }
}

function getFirstMatch(input, items) {
    var text = $(input).val().toLowerCase();
    if (text && text.length > 0) {
        for (itemData in items) {
            var item = items[itemData].value || itemData;
            if (item.toLowerCase().startsWith(text)) {
                return itemData;
            }
        }
        for (itemData in items) {
            var item = items[itemData].value || itemData;
            if (item.toLowerCase().indexOf(text) >= 0) {
                return itemData;
            }
        }
    }
    return null;
}

function hasValidAutocompletion(input) {
    var instance = M.Autocomplete.getInstance(input);
    if (instance) {
        return (instance.activeIndex >= 0);
    }
    return false;
}

function getCrewELO(crew) {
    for (var row of window.scorebot.standingsData) {
        if (row[window.scorebot.standingsCols.tag] === crew) {
            var current = parseInt(row[window.scorebot.standingsCols.elo]);
            return getCrewEloWithBatch(crew, current);
        }
    }
    return 0;
}

function getCrewEloWithBatch(crew, currentElo) {
    var cols = window.scorebot.batchCols;
    var result = parseInt(currentElo);
    for (var item of window.scorebot.batchData) {
        if (item.data[cols.winner] == crew) {
            result = parseInt(result) + parseInt(item.data[cols.eloIncrease]);
        }
        if (item.data[cols.loser] == crew) {
            result = parseInt(result) - parseInt(item.data[cols.eloIncrease]);
        }
    }
    return result;
}

function getRankDifference(crewAELO, crewBELO) {
    var arank = getRankFromELO(crewAELO);
    var brank = getRankFromELO(crewBELO);
    var result = arank - brank;
    if (result < 0) {
        result = result * -1;
    }
    return result;
}

function initializeAutoComplete(element, data, onAutoCompleteCb) {
    var autocompleteData = {};
    var backingData = {};
    for (var item in data) {
        var text = data[item].value || item;
        autocompleteData[text] = null;
        if (data[item].value) {
            backingData[data[item].value] = data[item];
        }
    }
    var autocomplete = M.Autocomplete.init(element, {
        data: autocompleteData, onAutocomplete: function (val) {
            var itemData = backingData[val];
            onAutoCompleteCb(val, itemData, element);
        }
    });
    if (!autocomplete) {
        return null;
    }
    autocomplete.dropdown.options.constrainWidth = false;
    $(element).on("blur", function () {
        var backingField = $(this).closest(".input-field").find("input[type='hidden']");
        manageAutocompleteBlur(this, backingField, data, onAutoCompleteCb);
    });
    return autocomplete;
}

function onCrewAutoCompleted(value, input) {
    var crewInfo = window.scorebot.crewData.find(function (crewValue) {
        crewValue.value === value
    });
    var tag = crewInfo.tag;
    var backingField = $(input).closest(".input-field").find("input[type='hidden']");
    if (backingField) {
        $(backingField).val(tag);
    }
}

function parseDate(date) {
    var dateParts = date.split("/");
    var dateStr = dateParts[2] + "-" + dateParts[1].padStart(2, '0') + "-" + dateParts[0].padStart(2, '0');
    return new Date(dateStr);
}

function pad(number) {
    if (number < 10) {
        return '0' + number;
    }
    return number;
}

function toIsoDate(date) {
    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate());
}

function calculateMatchResult(winnerElo, loserElo, stockDiff) {

    var Q = winnerElo;
    var P = loserElo;

    var d = parseInt(stockDiff);
    var R = getRankDifference(Q, P);

    var mode = "-";
    if (Q >= P) {
        var result = (P / Q * ((50 + d) * (1 - R / 5)));
    } else {
        mode = "Y"
        var result = (P / Q * ((50 + d) * (1 + R / 5)));
    }
    return {
        "upset": mode,
        "elo": Math.round(result)
    };
}

function getRankFromELO(ELO) {
    if (ELO <= 1349) {
        return 1; //Bronze
    }
    if (ELO <= 1499) {
        return 2; //Silver
    }
    if (ELO <= 1749) {
        return 3;//Gold
    }
    if (ELO <= 1999) {
        return 4;//Platinum
    }
    if (ELO > 1999) {
        return 5;//Diamond
    }
}

function getLastMatchDate() {
    var result = null;
    for (var item of window.scorebot.historyData) {
        var date = parseOnlyDate(item[window.scorebot.historyCols.date]);
        if (!result || result < date) {
            result = date;
        }
    }
    if (window.scorebot.batchData) {
        for (var item of window.scorebot.batchData) {
            var date = parseOnlyDate(item.data[window.scorebot.batchCols.date]);
            if (date > result) {
                result = date;
            }
        }
    }
    return result;
}

function parseOnlyDate(date) {
    var date = new Date(Date.parse(date));
    var newDate = new Date(date.getFullYear(), date.getMonth() + 1, date.getDay(), 0, 0, 0, 0);
    return newDate.getTime();
}

function createInputField(type, name, title, value, classList, inputOptions) {
    var input = $("<div class='input-field " + classList + "'></div>");
    input.append("<input type='" + type + "' name='" + name + "' data-field='" + name + "' " + inputOptions + " value='" + value + "'>");
    input.append("<label for='" + name + "'>" + title + "</label>");
    input.append("<span class='helper-text'></span>");
    return input;
}

function createDisabledInputField(type, name, title, value, classList, inputOptions) {
    var input = $("<div class='input-field " + classList + "'></div>");
    input.append("<input disabled type='" + type + "' name='" + name + "' data-field='" + name + "' " + inputOptions + " value='" + value + "'>");
    input.append("<label for='" + name + "'>" + title + "</label>");
    input.append("<span class='helper-text'></span>");
    return input;
}

function createNumericInputField(name, title, classList, value = '', max = '', min = '') {
    return createInputField("number", name, title, value, classList, "max='" + max + "' min='" + min + "'");
}
function createDisabledNumericInputField(name, title, classList, value = '', max = '', min = '') {
    return createDisabledInputField("number", name, title, value, classList, "max='" + max + "' min='" + min + "'");
}


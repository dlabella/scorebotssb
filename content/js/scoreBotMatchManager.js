var matchManager = function () {
    var self = {};
    console.log("Loading match manager plugin ...");

    var tableOptions = {
        columns: [
            { col: 0, colType: "hidden" },
            { col: 1, colType: "date" },
        ],
        usePaging: false,
        onCellClick: onMatchSelected
    };
    var cols = window.scorebot.historyCols;
    var container = {};
    var form = {};
    var simulateButton = {};
    var cancelButton = {};
    var submitButton = {};
    var modalId = "match-manager";
    var table = {
        load: function () { }
    };
    var matchSelected = null;

    var applyFilterTimeout = null;

    var message = "With great power comes with great responsibility, you are about to adjust a match and update core data, Are you sure? This process is not reversible!"
    window.scorebot.historyLoaded.subscribe(function (loaded) {
        if (loaded) {
            loadHistory();
        }
    });
    window.scorebot.crewsLoaded.subscribe(function (loaded) {
        if (loaded) {
            bindAutoCompleteInputs();
        }
    });
    $(".modal-trigger[data-target='" + modalId + "']").on("click", function () {
        resetForm(form);
        $("table tr .selected").removeClass(".selected");
        loadHistory();
    });
    $(document).ready(function () {
        container = $("#" + modalId);
        form = container.find("form");
        table = container.find(".js-dataTable").dataTable(tableOptions, 1, "Descending");
        container.find("input").on("keyup", function () {
            filter();
        });
        container.find("input").on("change", function () {
            filter();
        });
        if (window.scorebot.historyLoaded.getValue()) {
            loadHistory();
        }
        if (window.scorebot.crewsLoaded.getValue()) {
            bindAutoCompleteInputs();
        }
        container.find(".js-update-match").on("click", function () {
            window.scorebot.plugins.updateMatch.show(matchSelected);
        });
        $("#crew-info").find(".js-update-match-history").on("click", function () {
            if (window.scorebot.historyRowSelected) {
                window.scorebot.plugins.updateMatch.show(window.scorebot.historyRowSelected);
            }else{
                alert("no match selected...");
            }
        });
        $("#crew-info").find(".js-remove-match-history").on("click", function () {
            if (window.scorebot.historyRowSelected) {
                window.scorebot.plugins.removeMatch.show(window.scorebot.historyRowSelected);
            }else{
                alert("no match selected...");
            }
        });
        container.find(".js-remove-match").on("click", function () {
            window.scorebot.plugins.removeMatch.show(matchSelected);
        });
    });

    function bindAutoCompleteInputs() {
        var winnerAutocomplete = getField(container, "winnerAuto").get(0);
        var loserAutocomplete = getField(container, "loserAuto").get(0);
        initializeAutoComplete(winnerAutocomplete, window.scorebot.crews, onAutoComplete);
        initializeAutoComplete(loserAutocomplete, window.scorebot.crews, onAutoComplete);
    }

    function onAutoComplete(input, value) {
        onCrewAutoCompleted(input, value);
        filter();
    }

    function loadHistory() {
        var items = window.scorebot.historyData.filter(function (item) {
            return item[cols.matchType] !== "Team";
        });
        table.load(items);
    }

    function filter() {
        if (applyFilterTimeout) {
            clearTimeout(applyFilterTimeout);
        }
        applyFilterTimeout = setTimeout(applyFilter, 500);
    }

    function applyFilter() {
        var rawDate = getField(container, "date").val();
        var date = null;
        if (rawDate) {
            date = toIsoDate(new Date(rawDate));
        }
        var winner = getField(container, "winner").val();
        var loser = getField(container, "loser").val();

        var data = window.scorebot.historyData.filter(function (item) {
            var matches = true;
            matches = matches && (!date || (date === item[cols.date]));
            matches = matches && (!winner || (winner === item[cols.winnerTag]));
            matches = matches && (!loser || (loser === item[cols.loserTag]));
            matches = matches && item[cols.matchType] !== "Team";
            return matches;
        });

        table.load(data);
    }

    function onMatchSelected(row, col, data, rowData) {
        matchSelected = rowData;
    }

    loadHistoryData(false);
    self.name = "matchManager";
    return self;
};
window.scorebot.plugins["matchManager"] = matchManager();
var updateMatch = function () {
    var self = {};
    console.log("Loading Update match plugin ...");
    
    var simulationDataOptions = {
        columns: [
            { col: 1, onRenderCell: renderDiff },
            { col: 2, onRenderCell: renderDiff },
            { col: 3, colType: "hidden" },
            { col: 4, onRenderCell: renderDiff },
            { col: 5, onRenderCell: renderDiff },
            { col: 6, onRenderCell: renderDiff },
            { col: 7, onRenderCell: renderDiff },
            { col: 8, colType: "hidden" },
            { col: 9, colType: "hidden" }
        ],
        usePaging: false
    };
    var cols = window.scorebot.historyCols;
    var container = {};
    var form = {};
    var simulateButton = {};
    var cancelButton = {};
    var submitButton = {};
    var modalId = "update-match";
    var table = {
        load: function () { }
    };
    var selectedMatch = null;
    var message = "With great power comes with great responsibility, you are about to adjust a match and update core data, Are you sure? This process is not reversible!"
    window.scorebot.crewsLoaded.subscribe(function (loaded) {
        if (loaded) {
            bindAutoCompleteInputs();
        }
    });

    $(document).ready(function () {
        container = $("#" + modalId);
        form = container.find("form");
        table = container.find(".js-dataTable").dataTable(simulationDataOptions, 0, "Ascending");
        submitButton = container.find(".js-submit");
        cancelButton = container.find(".js-cancel");
        simulateButton = container.find(".js-simulate");
        simulateButton.on("click", function (e) {
            e.preventDefault();
            loadSimulation();
            return false;
        });
        manageFormSubmit(form, submitButton, "/history/updateMatch",
            () => { $("#tableLoading").show(); return false; },
            () => {
                closeModal(modalId);
                reloadFullData(true);
            },
            () => { return validate(form) && confirm(message); });
        container.find(".rotate").on("click", swapPlayers);
        getField(container,"stockDiff").on("change",function(){
            fieldUpdated(container, "stockDiff", cols.stockDiff);
        })
    });

    function initialize() {
        selectedMatch = null;
        resetForm(form);
        table.load([]);
    }

    function swapPlayers() {
        var icon = $(this);
        var winner = getField(container, "winnerTeam").val();
        var loser = getField(container, "loserTeam").val();
        if (icon.hasClass("rotate180")) {
            icon.removeClass("rotate180");
        } else {
            icon.addClass("rotate180");
        }
        getField(container, "winnerTeam").val(loser);
        fieldUpdated(container, "winnerTeam", cols.winnerTag);

        getField(container, "loserTeam").val(winner);
        fieldUpdated(container, "loserTeam", cols.loserTag);
    }

    function fieldUpdated(container, name, col) {
        if (selectedMatch && selectedMatch[col]) {
            var field = getField(container, name);
            var value = field.val();
            if ((selectedMatch[col] === value)) {
                field.removeClass("updated");
            } else {
                field.addClass("updated");
            }
        }
    }

    function bindAutoCompleteInputs() {
        var winnerAutocomplete = getField(container, "winnerAuto").get(0);
        var loserAutocomplete = getField(container, "loserAuto").get(0);
        initializeAutoComplete(winnerAutocomplete, window.scorebot.crews, onCrewAutoCompleted);
        initializeAutoComplete(loserAutocomplete, window.scorebot.crews, onCrewAutoCompleted);
    }

    function loadSimulationData(data) {
        var rows = [];
        for (var row of data.delete) {
            rows.push(toDataArray(row));
        }
        for (var row of data.update) {
            rows.push(toDataArray(row));
        }
        table.load(rows);
        $("#tableLoading").hide();
    }

    function renderDiff(row, column, cell, cellValue, rowValue) {
        if (!cellValue){
            return;
        }
        var parts = cellValue.toString().split(" -> ");
        if (parts[1] && parts[0]!==parts[1]) {
            cell.innerHTML = "<div class='group'><span class='from'>" + parts[0] + "</span><span class='material-icons'>chevron_right</span><span class='to'>" + parts[1] + "</span></div>";
        } else {
            cell.innerHTML = "<div class='group'><span class='from'>" + parts[0] + "</span></div>";
        }
    }

    function loadSimulation() {
        $("#tableLoading").show();
        postData("/history/updateMatchSimulation", form.serialize(),
            function (data) {
                loadSimulationData(data);
                $("#tableLoading").hide();
            },
            function (err) {
                console.log(err);
                $("#tableLoading").hide();
                alert("UPS! something went wrong! error: " + err);
            });
    }

    self.show = function (data) {
        var element = document.getElementById(modalId);
        var modal = M.Modal.getInstance(element);
        if (modal) {
            initialize();

            selectedMatch = data;
            getField(container, "winnerTeam").val(data[cols.winnerTag]);
            getField(container, "loserTeam").val(data[cols.loserTag]);
            getField(container, "date").val(data[cols.date]);
            getField(container, "stockDiff").val(data[cols.stockDiff]);
            getFieldLabel(container, "winnerTeam").text("Winner [" + data[cols.winnerTag] + "]");
            getFieldLabel(container, "loserTeam").text("Loser [ " + data[cols.loserTag] + " ]");
            getFieldLabel(container, "stockDiff").text("Stock [ " + data[cols.stockDiff] + " ]");

            getField(container, "winnerTeam_original").val(data[cols.winnerTag]);
            getField(container, "loserTeam_original").val(data[cols.loserTag]);
            getField(container, "date_original").val(data[cols.date]);
            getField(container, "stockDiff_original").val(data[cols.stockDiff]);

            modal.open();

            loadSimulation();
        }
    }
    self.name ="updateMatch";
    return self;
};
window.scorebot.plugins["updateMatch"]=updateMatch();
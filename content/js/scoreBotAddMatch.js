var addMatch = function () {
    var self = {};
    console.log("Loading add match plugin ...");

    var container = {};
    var modalId = "match-result";
    var form = {};
    var submitButton = {};
    var cancelButton = {};
    
    window.scorebot.crewsLoaded.subscribe(function (loaded) {
        if (loaded) {
            var winnerAutocomplete = getField(container, "winnerAuto").get(0);
            var loserAutocomplete = getField(container, "loserAuto").get(0);
            initializeAutoComplete(winnerAutocomplete, window.scorebot.crews, winnerAutocompleted);
            initializeAutoComplete(loserAutocomplete, window.scorebot.crews, loserAutocompleted);
        }
    });

    $(document).ready(function () {
        container = $("#" + modalId);
        form = container.find("form");
        submitButton = container.find(".js-submit");
        cancelButton = container.find(".js-cancel");

        $(".modal-trigger[data-target='" + modalId + "']").on("click", function () {
            resetForm(form);
            setMatchDefaultDate();
        });

        container.find("input").on("blur", function () {
            computeData();
        });

        manageFormSubmit(form, submitButton, "/match",
            () => { $("#tableLoading").show(); },
            () => { reloadFullData(true); },
            () => { return ((!window.scorebot.batchData || window.scorebot.batchData.length === 0) && validate(form)) });
    });

    function setMatchDefaultDate() {
        var dateField = getField(container, "date");
        datePicker = M.Datepicker.getInstance(dateField.get(0));
        if (dateField) {
            datePicker.setDate(new Date());
            datePicker.setInputValue();
        }
    }

    function winnerAutocompleted(value, itemData) {
        var crewInfo = itemData;
        var tag = crewInfo.key;
        var position = crewInfo.position;
        var elo = getCrewELO(tag);
        getField(container, "winner").val(tag);
        getField(container, "winnerElo").val(elo);
        getField(container, "winnerPosition").val(position);
        computeData();
    }

    function loserAutocompleted(value, itemData) {
        var crewInfo = itemData;
        var tag = crewInfo.key;
        var position = crewInfo.position;
        var elo = getCrewELO(tag);
        getField(container, "loser").val(tag);
        getField(container, "loserElo").val(elo);
        getField(container, "loserPosition").val(position);

        computeData();
    }

    function computeData() {
        var winner = getField(container, "winner").val();
        var loser = getField(container, "loser").val();
        var dStr = getField(container, "stockDiff").val();
        if (!dStr) {
            return null;
        }
        var stockDiff = parseInt(dStr);
        var winnerElo = getCrewELO(winner);
        var loserElo = getCrewELO(loser);
        var winnerRank = getRankFromELO(winnerElo);
        var loserRank = getRankFromELO(loserElo);

        var result = calculateMatchResult(winnerElo, loserElo, stockDiff);

        getField(container, "winnerRank").val(winnerRank);
        getField(container, "loserRank").val(loserRank);
        getField(container, "winnerUpset").val(result.upset);
        getField(container, "winnerIncrease").val(result.elo)
    }
    self.name = "addMatch";
    return self;
};
window.scorebot.plugins["addMatch"] = addMatch();
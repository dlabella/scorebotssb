var addTeamMatch = function () {
    var self = {};
    console.log("Loading add team match plugin ...");

    var container = {};
    var modalId = "team-match-result";
    var ready = window.scorebot.ready;
    var loaded = false;
    var initialized = false;
    var form = {};
    var submitButton = {};
    var cancelButton = {};

    window.scorebot.crewsLoaded.subscribe(function (crewsLoaded) {
        loaded = crewsLoaded;
        if (loaded && ready && !initialized) {
            initialize();
        }
    });

    window.addEventListener("scoreBotReady", function () {
        ready = true;
        if (loaded && ready && !initialized) {
            initialize();
        }
    });

    function initialize() {
        initialized = true;
        container = $("#" + modalId);
        form = container.find("form");
        submitButton = container.find(".js-submit");
        cancelButton = container.find(".js-cancel");
        var dateOptions = {
            "format": "dd/mm/yyyy"
        }
        M.Datepicker.init(document.querySelectorAll(".datepicker"), dateOptions);
        var teamScores = container.find(".js-winner-scores");
        var teamScore = $(teamScores[0].innerHTML).clone();

        manageFormSubmit(form, submitButton, "/teamMatch",
            () => { $("#tableLoading").show(); },
            () => { reloadFullData(true); },
            () => { return ((!window.scorebot.batchData || window.scorebot.batchData.length === 0) && validate(form)) });

        var winnerCrews = getField(container, "winnerCrews").get(0);
        var loserCrews = getField(container, "loserCrews").get(0);
        var winnerCrewsMVP = getField(container, "winnerCrewsMVP").get(0);
        var loserCrewMVP = getField(container, "loserCrewMVP").get(0);

        var winnersInstance = initializeSelect(winnerCrews, window.scorebot.crews);
        var losersInstance = initializeSelect(loserCrews, window.scorebot.crews);
        var winnerCrewsMVPInstance = initializeSelect(winnerCrewsMVP, window.scorebot.crews);
        var loserCrewMVPInstance = initializeSelect(loserCrewMVP, window.scorebot.crews);

        winnersInstance.$el.on("change", function () {
            var itemsSelected = getArrayFromSelection($(this).val());
            var winnerCrews = getCrewsByKey(itemsSelected);
            self.winners = getCrewGroup(winnerCrews);
            winnerCrewsMVPInstance.loadOptions(winnerCrews, true);
            buildWinnerTeamResultList(winnerCrews);
            var crews = getCrewsNotMatchesKey(itemsSelected);
            losersInstance.loadOptions(crews, true);
            manageScoreInputList(teamScores, teamScore, winnerCrews);
        });

        losersInstance.$el.on("change", function () {
            var itemsSelected = getArrayFromSelection($(this).val());
            var loserCrews = getCrewsByKey(itemsSelected);
            self.losers = getCrewGroup(loserCrews);
            loserCrewMVPInstance.loadOptions(loserCrews, true);
            var crews = getCrewsNotMatchesKey(itemsSelected);
            winnersInstance.loadOptions(crews, true);
        });

        $(".modal-trigger[data-target='" + modalId + "']").on("click", function () {
            resetForm(form);
            winnersInstance.loadOptions(window.scorebot.crews);
            losersInstance.loadOptions(window.scorebot.crews);
            setMatchDefaultDate();
        });
    }

    function manageScoreInputList(container, template, selectedItems) {
        if (!selectedItems) {
            return;
        }
        container.empty();
        var i = 0;
        for (var key in selectedItems) {
            var $inputContainer = $($(template).clone());
            var $label = $inputContainer.find("label");
            var keyName = "winnerScores[" + i + "]";
            var $input = $($inputContainer.find("input"));
            $label.text(key);
            $label.attr("for", keyName);
            $input.attr("name", keyName);
            $input[0].dataset.crew = key;
            $input[0].dataset.field = keyName;
            container.append($inputContainer);
            i++;
        }
    }

    function getCrewGroup(crewArray) {
        var result = {};
        for (var crewKey in crewArray) {
            var crew = crewArray[crewKey];
            result[crewKey] = {
                "crew": crew,
                "result": null,
                "isMVP": false,
            }
        }
        return result;
    }

    function buildWinnerTeamResultList(winnerCrews) {
        var result = $(container.find(".js-team-scores"));
        result.empty();
        var i = 0;
        for (var crew in winnerCrews) {
            result.append(createTeamResultInput(crew, "", "winnerCrewAddition[" + i + "]"));
            result.find("input").on("change", onScoreUpdated);
            i = i + 1;
        }
    }
    function onScoreUpdated(e) {
        var $el = $(e.target);
        var crew = $el.data("crew");
        var result = $el.val();
        var result = $(container.find(".js-team-result"));
        if (self.winners[crew]) {
            self.winners[crew].result = result;
            if (self.winners[crew].isMVP) {
                self.winners[crew].result = result + 5;
            }

            result.find("[data-crew='" + crew + "'").val(self.winners[crew].result);
        }
    }
    function createTeamResultInput(crew, title, name, value = "") {
        var inputGroup = $("<div class='input-group col s12'></div>");
        inputGroup.append("<div class='title col s6'>" + window.scorebot.crews[crew].value + "</div>");
        var $input = $(createNumericInputField(name, title, "inline col s6", value, "5", "0"));
        $input.find("input").data("crew", crew);
        inputGroup.append($input);
        return inputGroup;
    }
    function createTeamResultReadOnly(crew, title, name, value = "") {
        var inputGroup = $("<div class='input-group col s12'></div>");
        inputGroup.append("<div class='title col s6'>" + window.scorebot.crews[crew].value + "</div>");
        var $input = $(createNumericInputField(name, title, "inline col s6", value, "5", "0"));
        $input.find("input").data("crew", crew);
        inputGroup.append($input);
        return inputGroup;
    }

    function getArrayFromSelection(selectedItems) {
        var result = [];
        for (var item in selectedItems) {
            result.push(selectedItems[item]);
        }
        return result;
    }
    function getCrewsByKey(keys, addEmpty) {
        var result = {};
        if (addEmpty) {
            var empty = getEmptyCrew();
            result[empty.key] = empty;
        }
        for (var key of keys) {
            var crew = window.scorebot.crews[key];
            if (crew) {
                result[key] = crew;
            }
        }
        return result;
    }
    function getCrewsNotMatchesKey(keys, addEmpty) {
        var result = {};
        if (addEmpty) {
            var empty = getEmptyCrew();
            result[empty.key] = empty;
        }
        for (var crewKey in window.scorebot.crews) {
            var finded = false;
            for (var key of keys) {
                if (crewKey === key) {
                    finded = true;
                    break;
                }
            }
            if (!finded) {
                result[crewKey] = window.scorebot.crews[crewKey];
            }
        }
        return result;
    }
    function getEmptyCrew() {
        return {
            key: "",
            value: ""
        };
    }


    function compareStrings(a, b) {
        if (a === b) {
            return 0;
        }
        return (a < b) ? 1 : -1;
    }

    function initializeSelect(select, items) {
        var instance = M.FormSelect.getInstance(select);
        instance.options.useValueForText = true;
        if (instance.loadOptions) {
            instance.loadOptions(items);
        }
        return instance;
    }


    function setMatchDefaultDate() {
        var dateField = getField(container, "date");
        datePicker = M.Datepicker.getInstance(dateField.get(0));
        if (dateField) {
            datePicker.setDate(new Date());
            datePicker.setInputValue();
        }
    }


    self.name = "addTeamMatch";
    return self;
};
window.scorebot.plugins["addTeamMatch"] = addTeamMatch();
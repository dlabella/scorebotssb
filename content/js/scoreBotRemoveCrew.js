var removeCrew = function () {
    var self = {};
    console.log("Loading remove crew plugin ...");
    
    var modalId = "remove-crew";
    var message = "With great power comes with great responsibility, you are about to remove a crew and all its data, Are you sure? This process is not reversible!"
    window.scorebot.crewsLoaded.subscribe(function (loaded) {
        if (loaded) {
            bindAutoCompleteInputs(self.container);
        }
    });
    $(document).ready(function () {
        self.container = $("#" + modalId);
        self.submitButton = self.container.find(".js-submit");
        self.form = self.container.find("form");
        self.crewTagElement = self.container.find("[name='crewTag']");
        $(".modal-trigger[data-target='" + modalId + "']").on("click", function () {
            resetForm(self.form);
        });
        manageFormSubmit(self.form, self.submitButton, "/crew/delete",
            () => { },
            () => { reloadFullData(true); $("#tableLoading").hide();  },
            () => { return validateData(); });
    });

    function validateData(){
        result = window.prompt("Type DELETE to remove crew", "");
        if (result != "DELETE") {
            window.alert("cancelled");
            return false;
        }
        var crewTag = self.crewTagElement.val();
        if (!crewTag){
            return false;
        }
        if (!confirm(message)){
            return false;
        }
        $("#tableLoading").show(); 
        return true;
    }

    function bindAutoCompleteInputs(container) {
        var crew = getField(container, "crewAuto").get(0);
        initializeAutoComplete(crew, window.scorebot.crews, onAutocompleted);
    }

    function onAutocompleted(value, itemData) {
        self.crewTagElement.val(itemData.key);
    }
    self.name = "removeCrew";
    return self;
};
window.scorebot.plugins["removeCrew"] = removeCrew();
var addCrew = function () {
    var self={};
    console.log("Loading add crew plugin ...");

    $(document).ready(function () {
        var container = $("#add-crew");
        var submitButton = container.find(".js-submit");
        var form = container.find("form");
        manageFormSubmit(form, submitButton, "/crew",
        () => { },
        () => { loadScoreData(true); });
    });
    self.name="addCrew";
    return self;
};
window.scorebot.plugins["addCrew"]=addCrew();
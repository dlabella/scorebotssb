var bugManager = function () {
    var self={};
    console.log("Loading bug manager plugin ...");

    var modalId = "bug-manager"
    $(document).ready(function () {
        var container = $("#"+modalId);
        var submitBugButton = container.find(".js-submit-bug");
        var form = container.find("form");
        manageFormSubmit(form, submitBugButton, "/bug/inform",
        () => { },
        () => { loadBugData(true); });
    });
    self.name="bugManager";
    return self;
};
window.scorebot.plugins["bugManager"]=bugManager();
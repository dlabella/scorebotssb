var renameCrew = function () {
    var self = {};
    console.log("Loading rename crew plugin ...");
    
    var modalId = "rename-crew";
    window.scorebot.crewsLoaded.subscribe(function (loaded) {
        if (loaded) {
            bindAutoCompleteInputs(self.container);
        }
    });
    $(document).ready(function () {
        self.container = $("#" + modalId);
        self.submitButton = self.container.find(".js-submit");
        self.form = self.container.find("form");
        self.oldTagElement = self.container.find("[name='oldTag']");
        self.newTagElement = self.container.find("[name='newTag']");
        self.oldNameElement = self.container.find("[name='oldName']");
        self.newNameElement = self.container.find("[name='newName']");
        $(".modal-trigger[data-target='" + modalId + "']").on("click", function () {
            resetForm(self.form);
        });
        manageFormSubmit(self.form, self.submitButton, "/crew/rename",
            () => { },
            () => { reloadFullData(true); $("#tableLoading").hide();  },
            () => { return validateData(); });
    });
    function validateData(){
        var oldTag = self.oldTagElement.val();
        var newTag = self.newTagElement.val();
        var oldName = self.oldNameElement.val();
        var newName = self.newNameElement.val();
        if(!oldTag || !newTag || !oldName || !newName){
            alert("All fields are required");
            return false;
        }
        if(oldTag === newTag && oldName === newName){
            alert("The new tag and name must be different from the old ones");
            return false;
        }
        var crew = window.scorebot.crews[newTag];
        if (crew){
            alert("The tag '" + newTag + "' already exists. is a crew with the name '" + crew.name + "'");
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
        self.oldTagElement.val(itemData.key);
        self.oldNameElement.val(itemData.name);
    }
    self.name = "renameCrew";
    return self;
};
window.scorebot.plugins["renameCrew"] = renameCrew();
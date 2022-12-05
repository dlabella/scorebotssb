var addUser = function () {
    var self = {};
    console.log("Loading add user plugin ...");

    $(document).ready(function () {
        var container = $("#user-container");
        var submitButton = container.find(".js-submit");
        var form = container.find("form");
        table = container.dataTable({
            usePaging: false
        });
        manageFormSubmit(form, submitButton, "/user",
            () => { },
            () => { loadData(); });
        loadData();
    });

    function loadData() {
        return fetch('/user')
        .then(response => {
            processResponse(response).then(() => {
                $("#tableLoading").hide();
            });
        })
        .catch(ex => {
            alert("Ups! there was an error loading user data, error: " + ex);
            console.log("ERROR: " + ex)
        });
    }

    function processResponse(response) {
        return response.json().then(data => {
            table.load(data);
        });
    }

    self.name = "addUser";
    return self;
};
window.scorebot.plugins["addUser"] = addUser();
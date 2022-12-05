var scorebotUsers = function () {
    var self={};
    var container = {};
    var form = {};
    var submitButton = {};
    var table = {
        load: function () { }
    };
    var tableContainer= {};

    $(document).ready(function () {
        container = $("#user-management");
        submitButton = container.find(".js-submit");
        form = container.find("form");
        tableContainer = container.find('.js-dataTable');
        table = tableContainer.dataTable({
            usePaging: false
        });

        manageFormSubmit(form, submitButton, "/user",
        () => { },
        () => { loadUsers(); });

        container.find('.js-delete-row').on("click", function () {
            var data = table.row('.selected').data();
            if (data && data.name != "default") {
                var retval = confirm("are you sure you want remove " + data.name + " user?");
                if (retval) {
                    deleteUser(data.name);
                    table.row('.selected').remove().draw(false);
                }
            } else {
                alert("no row selected or default user selected");
            }
        });

        loadUsers();
    });

    function loadUsers(){
        $("#tableLoading").show();
        return fetch('/user')
            .then(response => {
                processResponse(response).then(() => {
                    $("#tableLoading").hide();
                    tableContainer.show();
                });
            })
            .catch(ex => {
                alert("Ups! there was an error loading users, error: " + ex);
                console.log("ERROR: " + ex)
            });
    }
    function processResponse(response) {
        return response.json().then(data => {
            table.load(data);
        });
    }
    
    function deleteUser(user, successcb) {
        $.ajax({
            type: "DELETE",
            url: url + "?user=" + encodeURIComponent(user),
            success: function (data) {
                if (successCb) {
                    successCb();
                }
            },
            fail: function (xhr, textStatus, errorThrown) {
                alert('There was a problem updating the data, check datasource');
                console.log(errorThrown);
            }
        });
    }
    self.name ="scorebotUsers";
    return self;
};
window.scorebot.plugins["users"]=scorebotUsers();
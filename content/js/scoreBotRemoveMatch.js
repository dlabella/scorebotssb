var removeMatch = function () {
    var self = {};
    console.log("Loading remove match plugin ...");
    
    var simulationDataOptions = {
        columns: [
            { col: 2, onRenderCell: renderDiff},
            { col: 3, colType: "hidden" },
            { col: 4, onRenderCell: renderDiff },
            { col: 5, onRenderCell: renderDiff },
            { col: 7, onRenderCell: renderDiff },
            { col: 8, colType: "hidden" },
            { col: 9, colType: "hidden"}
        ],
        usePaging: false
    };
    var cols = window.scorebot.historyCols;
    var container = {};
    var form = {};
    var simulateButton = {};
    var cancelButton = {};
    var submitButton = {};
    var modalId = "remove-match";
    var table = {
        load: function () { }
    };
    var selectedMatch = null;
    var message="With great power comes with great responsibility, you are about to adjust a match and update core data, Are you sure? This process is not reversible!";

    $(document).ready(function () {
        container = $("#"+modalId);
        form =container.find("form");
        table = container.find(".js-dataTable").dataTable(simulationDataOptions, 0, "Ascending");
        submitButton = container.find(".js-submit");
        cancelButton = container.find(".js-cancel");
        simulateButton = container.find(".js-simulate");

        manageFormSubmit(form, simulateButton, "/history/removeMatchSimulation",
            () => { $("#tableLoading").show(); return false; },
            (data) => { loadSimulationData(data); },
            () =>{ return validate(form)});

        manageFormSubmit(form, submitButton, "/history/removeMatch",
            () => { $("#tableLoading").show(); return false; },
            () => {
                closeModal(modalId);
                reloadFullData(true);
            },
            () => { return validate(form) && confirm(message); });
    });

    function initialize(){
        resetForm(form);
        table.load([]);
    }

    function loadSimulation(){
        $("#tableLoading").show(); 
        postData("/history/removeMatchSimulation", form.serialize(), 
        function(data){
            loadSimulationData(data);
            $("#tableLoading").hide(); 
        }, 
        function (err) {
            console.log(err);
            $("#tableLoading").hide(); 
            alert("UPS! something went wrong! error: " + err);
        });
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
        if (parts[1]) {
            cell.innerHTML = "<div class='group'><span class='from'>" + parts[0] + "</span><span class='material-icons'>chevron_right</span><span class='to'>" + parts[1] + "</span></div>";
        } else {
            cell.innerHTML = "<div class='group'><span class='from'>" + parts[0] + "</span><span class='material-icons'>chevron_right</span><span class='to delete'> X </span></div>";
        }
    }
    self.show = function(data){
        var element = document.getElementById(modalId);
        var modal = M.Modal.getInstance(element);
        if (modal){
            initialize();

            selectedMatch = data;
            getField(container,"winnerTeam").val(data[cols.winnerTag]);
            getField(container,"loserTeam").val(data[cols.loserTag]);
            getField(container,"date").val(data[cols.date]);
            getField(container,"stockDiff").val(data[cols.stockDiff]);
            
            modal.open();
            loadSimulation();
        }
    }
    self.name="removeMatch";
    return self;
};
window.scorebot.plugins["removeMatch"]=removeMatch();
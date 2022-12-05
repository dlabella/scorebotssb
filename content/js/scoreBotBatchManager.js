var batchManager = function () {
    var self={};
    console.log("Loading batch manager plugin ...");

    var batchTable = null;
    var batchOptions = {
        columns: [
            { col: 0, colType: "hidden" },
            { col: 6, class: "hide-on-med-and-down" },
            { col: 7, onRenderCell: renderStatus }
        ],
        usePaging: false
    };
    var container = {};
    var form = {};
    var addToBatchButton = {};
    var cancelButton = {};
    var submitButton = {};
    var modalId = "match-result";
    $(document).ready(function () {
        container = $("#" + modalId);
        form = container.find("form");
        var modal = M.Modal.getInstance(container);
        modal.options.onOpenStart = function(){
            resetBatchData();
        }
        addToBatchButton = container.find(".js-addToBatch");
        cancelButton = container.find(".js-cancel");
        submitButton = container.find(".js-submit");

        addToBatchButton.on("click", addMatchFormToBatch);
        cancelButton.on("click", function () {
            window.scorebot.batchData = [];
        });
        submitButton.on("click", function (e) {
            if (window.scorebot.batchData  && window.scorebot.batchData.length > 0) {
                disableFooterActions();
                processBatch();
                return false;
            }
        });
    });

    function renderStatus(row, col, el, value, rowValue) {
        var icon = "file_upload";
        var text = "Pending";
        if (value === "false") {
            el.style.background = "orange";
            icon = "file_upload";
            text = "Pending";
        } else if (value === "processing") {
            el.style.background =  "#26a69a";
            icon = "settings";
            text = "Processing";
        } else if (value === "ok") {
            el.style.background = "lightGreen";
            icon = "done";
            text = "Done";
        } else if (value === "retrying") {
            el.style.background = "orange";
            icon = "replay";
            text = "Retrying";
        } else if (value === "failed") {
            el.style.background = "red";
            text = "Failed";
            icon = "sms_failed";
        }
        el.innerHTML = "<div class='status'><span>" + text + "</span><i class='material-icons right'>" + icon + "</i><div>"
    }

    function resetBatchData() {
        window.scorebot.batchData = [];
        container.css("display", "none");
        if (batchTable) {
            batchTable.load([]);
        }
    }

    function processBatch() {
        item = window.scorebot.batchData.find(function (item) {
            return item.status === 0;
        });
        if (item) {
            item.data[item.data.length - 1]="processing";
            loadBatchTableData();
            postData("/match", item.formData, function () {
                item.status = 1;
            }, function () {
                item.status = 2;
            }, function () {
                item.data[item.data.length - 1] = item.status === 1 ? "ok" : "failed";
                loadBatchTableData();
                processBatch();
            });
        } else {
            item = window.scorebot.batchData.find(function (item) {
                return item.status > 1;
            });
            if (item) {
                if (confirm("There were a problem syncing data, retry all failed?")) {
                    retryBatchFailed();
                } else {
                    enableFooterActions();
                }
            } else {
                batchCompleted();
            }
        }
    }

    function retryBatchFailed() {
        for (var item of window.scorebot.batchData) {
            if (item.status === 2) {
                item.status = 0;
                item.data[item.data.length - 1] = "retrying";
            }
        }
        loadBatchTableData();
        processBatch();
    }

    function batchCompleted() {

        enableFooterActions();
        $("#tableLoading").show();
        reloadFullData(true);
        closeModal(modalId);
    }

    function enableFooterActions() {
        submitButton.removeClass("disabled");
        addToBatchButton.removeClass("disabled");
    }

    function disableFooterActions() {
        submitButton.addClass("disabled");
        addToBatchButton.addClass("disabled");
    }

    function addMatchFormToBatch(e) {
        e.preventDefault();
        if (!validate(form)) {
            return false;
        }
        var date = form.find(".datepicker").val();
        var matchDate = parseOnlyDate(date);
        var lastMatchDate = getLastMatchDate();
        if (matchDate<lastMatchDate){
            alert("Match date cant be lower than last match date");
            return false;
        }
        container.css("display", "block");

        if (addDataToBatch()) {

            if (!batchTable) {
                var table = container.find('.js-dataTable');
                batchTable = table.dataTable(batchOptions, 0, "Descending");
                table.show();
            }
            loadBatchTableData();
            resetForm(form);
            setMatchDefaultDate();
            
        }

        return false;
    }

    function loadBatchTableData() {
        if (window.scorebot.batchData && batchTable) {
            var items = [];
            for (var item of window.scorebot.batchData) {
                items.push(item.data);
            }
            batchTable.load(items);
        }
    }

    function addDataToBatch() {
        var formData = form.serialize();
        var data = serializeToJson(form);
        var today = formatDate(new Date(Date.now()));
        if (window.scorebot.batchData && window.scorebot.batchData.find(function (m) { m.data === data })) {
            return false;
        }
        var arr = [];
        arr.push(window.scorebot.batchData.length);
        arr.push(data.winnerTeam);
        arr.push(data.loserTeam);
        arr.push(data.winnerTeamIncrease);
        arr.push(data.winnerTeamUpset);
        arr.push(data.stockDiff);
        arr.push(data.matchDate || today);
        arr.push("false");
        if (!window.scorebot.batchData){
            window.scorebot.batchData=[];
        }
        window.scorebot.batchData.push({
            formData: formData,
            data: arr,
            synced: false,
            status: 0
        });
        return true;
    }
    function setMatchDefaultDate() {
        var dateField = getField(container, "date");
        datePicker = M.Datepicker.getInstance(dateField.get(0));
        if (dateField) {
            datePicker.setDate(new Date());
            datePicker.setInputValue();
        }
    }

    
    self.name="batchManager";
    return self;
};
window.scorebot.plugins["batchManager"]=batchManager();
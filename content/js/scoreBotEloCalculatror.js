var eloCalculator = function () {

    var self = {};
    var modalId="elo-calculator";
    var container={};
    var form={};

    $(document).ready(function () {
        container = $("#"+modalId);
        form = container.find("form");
        $(".modal-trigger[data-target='" + modalId + "']").on("click", function () {
            initialize();
        });
        container.find("input").on("change", function(){
            doCalc()
        });
    });

    function initialize() {
        resetForm(form);
    }

    function doCalc(){
        var winnerElo = getField(container, "winnerElo").val();
        var loserElo = getField(container, "loserElo").val();
        var stockDiff = getField(container, "stockDiff").val();
        if (winnerElo && loserElo && stockDiff){
            var result = calculateMatchResult(parseInt(winnerElo), parseInt(loserElo), parseInt(stockDiff));
            getField(container, "newWinnerElo").val(parseInt(winnerElo)+result.elo);
            getField(container, "newLoserElo").val(parseInt(loserElo)-result.elo);
            getField(container, "increase").val(result.elo);
            getField(container, "upset").val(result.upset);
            var winnerRank = getRankFromELO(parseInt(winnerElo)+result.elo);
            getField(container, "newWinnerRank").val(winnerRank);
            getField(container, "newWinnerRankName").val(getRankName(winnerRank));
            var loserRank = getRankFromELO(parseInt(loserElo)-result.elo);
            getField(container, "newLoserRank").val(loserRank);
            getField(container, "newLoserRankName").val(getRankName(loserRank));
        }else{
            getField(container, "newWinnerElo").val("");
            getField(container, "newWinnerRank").val("");
            getField(container, "newWinnerRankName").val("");
            getField(container, "newLoserElo").val("");
            getField(container, "newLoserRank").val("");
            getField(container, "newLoserRankName").val("");
            getField(container, "increase").val("");
            getField(container, "upset").val("");
        }
    }

    self.name ="eloCalculator";
    return self;
};
window.scorebot.plugins["eloCalculator"]=eloCalculator();
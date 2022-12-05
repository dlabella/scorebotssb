module.exports = {
    getMatchResult,
    getRankFromELO
};

function getMatchResult(winnerElo, loserElo, stockDiff) {
    var P = loserElo;
    var Q = winnerElo;
    var d = stockDiff;
    var R = getRankDifference(Q, P);
    var mode = "-";
    var result=null;
    if (Q >= P) {
        result = (P / Q * ((50 + d) * (1 - R / 5)));
    } else {
        mode = "Y"
        result = (P / Q * ((50 + d) * (1 + R / 5)));
    }
    return {
        "upset":mode,
        "elo": Math.round(result)
    };
}

function getRankDifference(crewAELO, crewBELO) {
    var arank = getRankFromELO(crewAELO);
    var brank = getRankFromELO(crewBELO);
    var result = arank - brank;
    if (result < 0) {
        result = result * -1;
    }
    return result;
}

function getRankFromELO(ELO) {
    if (ELO <= 1349) {
        return 1; //Bronze
    }
    if (ELO <= 1499) {
        return 2; //Silver
    }
    if (ELO <= 1749) {
        return 3;//Gold
    }
    if (ELO <= 1999) {
        return 4;//Platinum
    }
    if (ELO > 1999) {
        return 5;//Diamond
    }
}
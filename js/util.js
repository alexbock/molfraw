"use strict";

// TODO complete this
function isLatexGreekLetterName(name) {
    var names = [
        "alpha", "beta", "gamma", "Delta", "delta", "omega"  
    ];
    return names.indexOf(name) !== -1;
}

function isParticularNumber(e, n) {
    e = e.safeSimplify();
    if (e instanceof NumberExpr) return e.value === n;
    else return false;
}

function isZero(e) {
    return isParticularNumber(e, 0);
}

function isOne(e) {
    return isParticularNumber(e, 1);
}

"use strict";

function Expr(range) {
    this.range = range;
}
Expr.prototype.toLatexString = function toLatexString() {
    pureVirtual();
};
Expr.prototype.toInputString = function toInputString() {
    pureVirtual();
};
Expr.prototype.bypassParens = function bypassParens() {
    return this;
};

// Wraps an expression enclosed in parentheses
function ParenExpr(subexpr, range) {
    Expr.call(this, range);
    this.subexpr = subexpr;
}
ParenExpr.prototype = Object.create(Expr.prototype);
ParenExpr.prototype.toLatexString = function toLatexString() {
    return "\\left(" + this.subexpr.toLatexString() + "\\right)";
};
ParenExpr.prototype.toInputString = function toInputString() {
    return "(" + this.subexpr.toInputString() + ")";
};
ParenExpr.prototype.bypassParens = function bypassParens() {
    return this.subexpr.bypassParens();
};

// A symbolic constant that should be preserved whenever possible
// with an underlying approximate numerical value
function SymbolicConstantExpr(constant, range) {
    Expr.call(this, range);
    this.constant = constant;
}
SymbolicConstantExpr.prototype = Object.create(Expr.prototype);
SymbolicConstantExpr.prototype.toLatexString = function toLatexString() {
    return constant.latex;
};
SymbolicConstantExpr.prototype.toInputString = function toInputString() {
    return constant.name;
};

// The imaginary unit i
function ImaginaryUnitExpr(range) {
    Expr.call(this, range);
}
ImaginaryUnitExpr.prototype = Object.create(Expr.prototype);
ImaginaryUnitExpr.prototype.toLatexString = function toLatexString() {
    return "\mathrm{i}";
};
ImaginaryUnitExpr.prototype.toInputString = function toInputString() {
    return "i";
};

// A symbolic variable
function VarExpr(name, range) {
    Expr.call(this, range);
    this.name = name;
}
VarExpr.prototype = Object.create(Expr.prototype);
VarExpr.prototype.toLatexString = function toLatexString() {
    if (isLatexGreekLetterName(this.name)) {
        return "\\" + this.name + "{}";
    } else if (this.name.indexOf("_") !== -1) {
        return this.name.substr(0, this.name.indexOf("_")) + "_{" +
               this.name.substr(this.name.indexOf("_") + 1) + "}";
    } else {
        return this.name;
    }
};
VarExpr.prototype.toInputString = function toInputString() {
    return this.name;
};

// A constant numerical value
function NumericalLiteralExpr(value, range) {
    Expr.call(this, range);
    this.value = value;
}
NumericalLiteralExpr.prototype = Object.create(Expr.prototype);
NumericalLiteralExpr.prototype.toLatexString = function toLatexString() {
    return this.value;
};
NumericalLiteralExpr.prototype.toInputString = function toInputString() {
    return this.value;
};

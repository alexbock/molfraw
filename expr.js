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
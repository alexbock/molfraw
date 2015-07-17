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
ParenExpr.parse = function parse(parser) {
    var lparen = parser.require("(");
    var subexpr = parser.parse(0);
    var rparen = parser.expect(")");
    var range = new Range(lparen.begin, rparen.end);
    return new ParenExpr(subexpr, range);
}

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
VarExpr.parse = function parse(parser) {
    var token = parser.next();
    return new VarExpr(token.str, token.range);
}

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

// A binary operator expression
function BinaryExpr(operator, lhs, rhs) {
    Expr.call(this, new Range(lhs.range.begin, rhs.range.end));
    this.operator = operator;
    this.lhs = lhs;
    this.rhs = rhs;
}
BinaryExpr.prototype = Object.create(Expr.prototype);
BinaryExpr.prototype.toInputString = function toInputString() {
    var lhsStr = this.lhs.toInputString();
    var rhsStr = this.lhs.toInputString();
    return lhsStr + " " + this.operator + " " + rhsStr;
};
BinaryExpr.parse = function parse(parser, lhs) {
    var token = parser.next();
    var rhs = parser.parse(this.precedence);
    return new this(lhs, rhs);
}

function AdditionExpr(lhs, rhs) {
    BinaryExpr.call(this, "+", lhs, rhs);
}
AdditionExpr.prototype = Object.create(BinaryExpr.prototype);
AdditionExpr.precedence = 30;
AdditionExpr.prototype.toLatexString = function toLatexString() {
    return lhs.toLatexString + " + " + rhs.toLatexString();
};

// A unary operator expression
function UnaryExpr(operator, operand, isPrefix, range) {
    Expr.call(this, range);
    this.operator = operator;
    this.operand = operand;
    this.isPrefix = isPrefix;
}
UnaryExpr.prototype = Object.create(Expr.prototype);
UnaryExpr.prototype.toLatexString = function toLatexString() {
    pureVirtual();
};
UnaryExpr.prototype.toInputString = function toInputString() {
    if (this.isPrefix) {
        return operator + this.operand.toInputString();
    } else {
        return this.operand.toInputString() + operator;
    }
};

// A unary prefix operator expression
function UnaryPrefixExpr(operator, operand, operatorOffset) {
    var range = new Range(operatorOffset, operand.range.end);
    UnaryExpr.call(this, operator, operand, true, range);
}
UnaryPrefixExpr.prototype = Object.create(UnaryExpr.prototype);
UnaryPrefixExpr.parse = function parse(parser, precedence) {
    var token = parser.next();
    var operand = parser.parse(precedence);
    return new UnaryPrefixExpr(token.str, operand, token.range.begin);
}

// A unary postfix operator expression
function UnaryPostfixExpr(operator, operand, operatorEnd) {
    var range = new Range(operand.range.begin, operatorEnd);
    UnaryExpr.call(this, operator, operand, false, range);
}
UnaryPostfixExpr.prototype = Object.create(UnaryExpr.prototype);

// A symbolic integral expression
function IntegralExpr(integrand, wrt, range) {
    Expr.call(this, range);
    this.integrand = integrand;
    this.wrt = wrt;
}
IntegralExpr.prototype = Object.create(Expr.prototype);
IntegralExpr.prototype.toLatexString = function toLatexString() {
    pureVirtual();
};
IntegralExpr.prototype.toInputString = function toInputString() {
    pureVirtual();
};

// An indefinite integral expression
function IndefiniteIntegralExpr(integrand, wrt, range) {
    IntegralExpr.call(this, integrand, wrt, range);
}
IndefiniteIntegralExpr.prototype = Object.create(IntegralExpr.prototype);
IndefiniteIntegralExpr.prototype.toLatexString = function toLatexString() {
    return "\\int{}" + this.integrand.toLatexString() +
        "\\,\\mathrm{d}" + this.wrt.toLatexString();
};
IndefiniteIntegralExpr.prototype.toInputString = function toInputString() {
    return "integrate " + this.integrand.toInputString() +
        " d" + this.wrt.toInputString();
};

// A symbolic definite integral expression
function DefiniteIntegralExpr(integrand, from, to, wrt, range) {
    IntegralExpr.call(integrand, wrt, range);
    this.from = from;
    this.to = to;
}
DefiniteIntegralExpr.prototype = Object.create(IntegralExpr.prototype);
DefiniteIntegralExpr.prototype.toLatexString = function toLatexString() {
    return "\\int_{" + this.from.toLatexString() + "}^{" +
        this.to.toLatexString() + "}" + this.integrand.toLatexString() +
        "\\,\\mathrm{d}" + this.wrt.toLatexString();
};
DefiniteIntegralExpr.prototype.toInputString = function toInputString() {
    return "integral from " + this.from.toInputString() +
        " to " + this.to.toLatexString() + " of " +
        this.integrand.toInputString() + " d" + this.wrt.toInputString();
};

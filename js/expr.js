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
Expr.prototype.safeSimplify = function safeSimplify() {
    return this;
};

// Wraps an expression enclosed in parentheses
function ParenExpr(subexpr, range) {
    Expr.call(this, range);
    this.subexpr = subexpr;
}
ParenExpr.prototype = Object.create(Expr.prototype);
ParenExpr.prototype.constructor = ParenExpr;
ParenExpr.prototype.toLatexString = function toLatexString() {
    return "\\left(" + this.subexpr.toLatexString() + "\\right)";
};
ParenExpr.prototype.toInputString = function toInputString() {
    return "(" + this.subexpr.toInputString() + ")";
};
ParenExpr.prototype.bypassParens = function bypassParens() {
    return this.subexpr.bypassParens();
};
ParenExpr.prototype.safeSimplify = function safeSimplify() {
    return this.subexpr.safeSimplify();
};
ParenExpr.parse = function parse(parser) {
    var lparen = parser.require("(");
    var subexpr = parser.parse(0);
    var rparen = parser.expect(")");
    var range = new Range(lparen.range.begin, rparen.range.end);
    return new ParenExpr(subexpr, range);
}

// A symbolic constant that should be preserved whenever possible
// with an underlying approximate numerical value
function SymbolicConstantExpr(constant, range) {
    Expr.call(this, range);
    this.constant = constant;
}
SymbolicConstantExpr.prototype = Object.create(Expr.prototype);
SymbolicConstantExpr.prototype.constructor = SymbolicConstantExpr;
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
ImaginaryUnitExpr.prototype.constructor = ImaginaryUnitExpr;
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
VarExpr.prototype.constructor = VarExpr;
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
NumericalLiteralExpr.prototype.constructor = NumericalLiteralExpr;
NumericalLiteralExpr.prototype.toLatexString = function toLatexString() {
    return this.value;
};
NumericalLiteralExpr.prototype.toInputString = function toInputString() {
    return this.value;
};
NumericalLiteralExpr.parse = function parse(parser) {
    var token = parser.next();
    var value = token.str / 1;
    return new NumericalLiteralExpr(value, token.range);
}

// A binary operator expression
function BinaryExpr(operator, lhs, rhs) {
    Expr.call(this, new Range(lhs.range.begin, rhs.range.end));
    this.operator = operator;
    this.lhs = lhs;
    this.rhs = rhs;
}
BinaryExpr.prototype = Object.create(Expr.prototype);
BinaryExpr.prototype.constructor = BinaryExpr;
BinaryExpr.prototype.toInputString = function toInputString() {
    var lhsStr = this.lhs.toInputString();
    var rhsStr = this.rhs.toInputString();
    return lhsStr + " " + this.operator + " " + rhsStr;
};
BinaryExpr.parse = function parse(parser, lhs) {
    var token = parser.next();
    var precedence = this.precedence;
    if (this.rightAssociative) {
        --precedence;
    }
    var rhs = parser.parse(precedence);
    return new this(lhs, rhs);
};

function AdditionExpr(lhs, rhs) {
    BinaryExpr.call(this, "+", lhs, rhs);
}
AdditionExpr.prototype = Object.create(BinaryExpr.prototype);
AdditionExpr.prototype.constructor = AdditionExpr;
AdditionExpr.precedence = 30;
AdditionExpr.prototype.toLatexString = function toLatexString() {
    return this.lhs.toLatexString() + " + " + this.rhs.toLatexString();
};
AdditionExpr.prototype.safeSimplify = function safeSimplify() {
    var lhsr = this.lhs.safeSimplify();
    var rhsr = this.rhs.safeSimplify();
    if (lhsr instanceof NumericalLiteralExpr &&
        rhsr instanceof NumericalLiteralExpr) {
        return new NumericalLiteralExpr(lhsr.value + rhsr.value, this.range);
    } else {
        return new this.constructor(lhsr, rhsr);
    }
};

function SubtractionExpr(lhs, rhs) {
    BinaryExpr.call(this, "-", lhs, rhs);
}
SubtractionExpr.prototype = Object.create(BinaryExpr.prototype);
SubtractionExpr.prototype.constructor = SubtractionExpr;
SubtractionExpr.precedence = 30;
SubtractionExpr.prototype.toLatexString = function toLatexString() {
    return this.lhs.toLatexString() + " - " + this.rhs.toLatexString();
};
SubtractionExpr.prototype.safeSimplify = function safeSimplify() {
    var lhsr = this.lhs.safeSimplify();
    var rhsr = this.rhs.safeSimplify();
    if (lhsr instanceof NumericalLiteralExpr &&
        rhsr instanceof NumericalLiteralExpr) {
        return new NumericalLiteralExpr(lhsr.value - rhsr.value, this.range);
    } else {
        return new this.constructor(lhsr, rhsr);
    }
};

function MultiplicationExpr(lhs, rhs) {
    BinaryExpr.call(this, "*", lhs, rhs);
}
MultiplicationExpr.prototype = Object.create(BinaryExpr.prototype);
MultiplicationExpr.prototype.constructor = MultiplicationExpr;
MultiplicationExpr.precedence = 50;
MultiplicationExpr.prototype.toLatexString = function toLatexString() {
    return this.lhs.toLatexString() + " \\cdot{} " + this.rhs.toLatexString();
};
MultiplicationExpr.prototype.safeSimplify = function safeSimplify() {
    var lhsr = this.lhs.safeSimplify();
    var rhsr = this.rhs.safeSimplify();
    if (lhsr instanceof NumericalLiteralExpr &&
        rhsr instanceof NumericalLiteralExpr) {
        return new NumericalLiteralExpr(lhsr.value * rhsr.value, this.range);
    } else {
        return new this.constructor(lhsr, rhsr);
    }
};

function ImplicitMultiplicationExpr(lhs, rhs) {
    MultiplicationExpr.call(this, lhs, rhs);
}
ImplicitMultiplicationExpr.prototype = Object.create(MultiplicationExpr.prototype);
ImplicitMultiplicationExpr.prototype.constructor = ImplicitMultiplicationExpr;
ImplicitMultiplicationExpr.precedence = 60;
ImplicitMultiplicationExpr.prototype.toLatexString = function toLatexString() {
    return this.lhs.toLatexString() + "\\,{}" + this.rhs.toLatexString();
};
ImplicitMultiplicationExpr.parse = function parse(parser, lhs) {
    var rhs = parser.parse(ImplicitMultiplicationExpr.precedence);
    return new ImplicitMultiplicationExpr(lhs, rhs);
};

function DivisionExpr(lhs, rhs) {
    BinaryExpr.call(this, "/", lhs, rhs);
}
DivisionExpr.prototype = Object.create(BinaryExpr.prototype);
DivisionExpr.prototype.constructor = DivisionExpr;
DivisionExpr.precedence = 50;
DivisionExpr.prototype.toLatexString = function toLatexString() {
    return "\\frac{" + this.lhs.toLatexString() +
        "}{" + this.rhs.toLatexString() + "}";
};
DivisionExpr.prototype.safeSimplify = function safeSimplify() {
    var lhsr = this.lhs.safeSimplify();
    var rhsr = this.rhs.safeSimplify();
    if (lhsr instanceof NumericalLiteralExpr &&
        rhsr instanceof NumericalLiteralExpr) {
        return new NumericalLiteralExpr(lhsr.value / rhsr.value, this.range);
    } else {
        return new this.constructor(lhsr, rhsr);
    }
};

function ExponentiationExpr(lhs, rhs) {
    BinaryExpr.call(this, "^", lhs, rhs);
}
ExponentiationExpr.prototype = Object.create(BinaryExpr.prototype);
ExponentiationExpr.prototype.constructor = ExponentiationExpr;
ExponentiationExpr.precedence = 80;
ExponentiationExpr.rightAssociative = true;
ExponentiationExpr.prototype.toLatexString = function toLatexString() {
    return this.lhs.toLatexString() + "^{" + this.rhs.toLatexString() + "}";
};
ExponentiationExpr.prototype.safeSimplify = function safeSimplify() {
    var lhsr = this.lhs.safeSimplify();
    var rhsr = this.rhs.safeSimplify();
    if (lhsr instanceof NumericalLiteralExpr &&
        rhsr instanceof NumericalLiteralExpr) {
        return new NumericalLiteralExpr(Math.pow(lhsr.value, rhsr.value), this.range);
    } else {
        return new this.constructor(lhsr, rhsr);
    }
};

// A unary operator expression
function UnaryExpr(operator, operand, isPrefix, range) {
    Expr.call(this, range);
    this.operator = operator;
    this.operand = operand;
    this.isPrefix = isPrefix;
}
UnaryExpr.prototype = Object.create(Expr.prototype);
UnaryExpr.prototype.constructor = UnaryExpr;
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
UnaryPrefixExpr.prototype.constructor = UnaryPrefixExpr;
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
UnaryPostfixExpr.prototype.constructor = UnaryPostfixExpr;

// A symbolic integral expression
function IntegralExpr(integrand, wrt, range) {
    Expr.call(this, range);
    this.integrand = integrand;
    this.wrt = wrt;
}
IntegralExpr.prototype = Object.create(Expr.prototype);
IntegralExpr.prototype.constructor = IntegralExpr;
IntegralExpr.prototype.toLatexString = function toLatexString() {
    pureVirtual();
};
IntegralExpr.prototype.toInputString = function toInputString() {
    pureVirtual();
};
IntegralExpr.parse = function parse(parser) {
    throw new Error("not yet implemented"); // TODO
};

// An indefinite integral expression
function IndefiniteIntegralExpr(integrand, wrt, range) {
    IntegralExpr.call(this, integrand, wrt, range);
}
IndefiniteIntegralExpr.prototype = Object.create(IntegralExpr.prototype);
IndefiniteIntegralExpr.prototype.constructor = IndefiniteIntegralExpr;
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
DefiniteIntegralExpr.prototype.constructor = DefiniteIntegralExpr;
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

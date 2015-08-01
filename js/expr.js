"use strict";

function Expr() {
}
Expr.prototype.toLatexString = function toLatexString() {
    pureVirtual();
};
Expr.prototype.toInputString = function toInputString() {
    pureVirtual();
};
Expr.prototype.safeSimplify = function safeSimplify() {
    return this;
};
Expr.prototype.derivative = function derivative(wrt) {
    pureVirtual();
};
Expr.prototype.guessPrimaryVariable = function guessPrimaryVariable() {
    return null;
};

// Wraps an expression enclosed in parentheses
function parseParenExpr(parser) {
    parser.require("(");
    var subexpr = parser.parse(0);
    parser.expect(")");
    return subexpr;
}

// A symbolic constant that should be preserved whenever possible
// with an underlying approximate numerical value
function SymbolicConstantExpr(constant) {
    Expr.call(this);
    this.constant = constant;
}
SymbolicConstantExpr.prototype = Object.create(Expr.prototype);
SymbolicConstantExpr.prototype.constructor = SymbolicConstantExpr;
SymbolicConstantExpr.prototype.toLatexString = function toLatexString() {
    return this.constant.latex;
};
SymbolicConstantExpr.prototype.toInputString = function toInputString() {
    return this.constant.name;
};
SymbolicConstantExpr.prototype.derivative = function derivative() {
    return new NumberExpr(0);
};
SymbolicConstantExpr.parse = function parse(parser) {
    var token = parser.next();
    var constant = null;
    if (token.str == "e") constant = Constant.E;
    else if (token.str == "pi") constant = Constant.PI;
    else throw new Error("unrecognized constant");
    return new SymbolicConstantExpr(constant);
}

// The imaginary unit i
function ImaginaryUnitExpr() {
    Expr.call(this);
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
function VarExpr(name) {
    Expr.call(this);
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
VarExpr.prototype.derivative = function derivative(wrt) {
    if (wrt === this.name) return new NumberExpr(1);
    else return new NumberExpr(0);
};
VarExpr.prototype.guessPrimaryVariable = function guessPrimaryVariable() {
    return this.name;
};
VarExpr.parse = function parse(parser) {
    var token = parser.next();
    return new VarExpr(token.str);
}

// A constant numerical value
function NumberExpr(value) {
    Expr.call(this);
    this.value = value;
}
NumberExpr.prototype = Object.create(Expr.prototype);
NumberExpr.prototype.constructor = NumberExpr;
NumberExpr.prototype.toLatexString = function toLatexString() {
    return this.value;
};
NumberExpr.prototype.toInputString = function toInputString() {
    return this.value;
};
NumberExpr.prototype.derivative = function derivative(wrt) {
    return new NumberExpr(0);
};
NumberExpr.parse = function parse(parser) {
    var token = parser.next();
    var value = token.str / 1;
    return new NumberExpr(value);
}

// A binary operator expression
function BinaryExpr(operator, lhs, rhs) {
    Expr.call(this);
    this.operator = operator;
    this.lhs = lhs;
    this.rhs = rhs;
}
BinaryExpr.prototype = Object.create(Expr.prototype);
BinaryExpr.prototype.constructor = BinaryExpr;
BinaryExpr.prototype.toInputString = function toInputString() {
    var lhsStr = this.lhs.toInputString();
    var rhsStr = this.rhs.toInputString();
    lhsStr = this.maybeParenthesize(this.lhs, lhsStr);
    rhsStr = this.maybeParenthesize(this.rhs, rhsStr);
    return lhsStr + " " + this.operator + " " + rhsStr;
};
BinaryExpr.prototype.guessPrimaryVariable = function guessPrimaryVariable() {
    return this.lhs.guessPrimaryVariable() || this.rhs.guessPrimaryVariable();
};
BinaryExpr.prototype.shouldParenthesize = function shouldParenthesize(subexpr) {
    if (subexpr != this.lhs && subexpr != this.rhs) {
        throw new Error("expected left or right hand side");
    }
    if (subexpr.constructor.precedence === undefined) return false;
    var less = subexpr.constructor.precedence < this.constructor.precedence;
    if (!less) return false;
    if (subexpr instanceof BinaryExpr) return true;
    if (subexpr instanceof UnaryPrefixExpr && subexpr == this.lhs) return true;
    if (subexpr instanceof UnaryPostfixExpr && subexpr == this.rhs) return true;
    return false;
};
BinaryExpr.prototype.maybeParenthesize = function maybeParenthesize(side, str) {
    if (this.shouldParenthesize(side)) return "(" + str + ")";
    else return str;
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
    var lhsStr = this.maybeParenthesize(this.lhs, this.lhs.toLatexString());
    var rhsStr = this.maybeParenthesize(this.rhs, this.rhs.toLatexString());
    return lhsStr + " + " + rhsStr;
};
AdditionExpr.prototype.safeSimplify = function safeSimplify() {
    var lhsr = this.lhs.safeSimplify();
    var rhsr = this.rhs.safeSimplify();
    if (lhsr instanceof NumberExpr &&
        rhsr instanceof NumberExpr) {
        return new NumberExpr(lhsr.value + rhsr.value);
    } else if (isZero(lhsr)) return rhsr;
    else if (isZero(rhsr)) return lhsr;
    else {
        return new this.constructor(lhsr, rhsr);
    }
};
AdditionExpr.prototype.derivative = function derivative(wrt) {
    var lhsd = this.lhs.derivative(wrt);
    var rhsd = this.rhs.derivative(wrt);
    return new AdditionExpr(lhsd, rhsd);
};

function SubtractionExpr(lhs, rhs) {
    BinaryExpr.call(this, "-", lhs, rhs);
}
SubtractionExpr.prototype = Object.create(BinaryExpr.prototype);
SubtractionExpr.prototype.constructor = SubtractionExpr;
SubtractionExpr.precedence = 30;
SubtractionExpr.prototype.toLatexString = function toLatexString() {
    var lhsStr = this.maybeParenthesize(this.lhs, this.lhs.toLatexString());
    var rhsStr = this.maybeParenthesize(this.rhs, this.rhs.toLatexString());
    return lhsStr + " - " + rhsStr;
};
SubtractionExpr.prototype.safeSimplify = function safeSimplify() {
    var lhsr = this.lhs.safeSimplify();
    var rhsr = this.rhs.safeSimplify();
    if (lhsr instanceof NumberExpr &&
        rhsr instanceof NumberExpr) {
        return new NumberExpr(lhsr.value - rhsr.value);
    } else {
        return new this.constructor(lhsr, rhsr);
    }
};
SubtractionExpr.prototype.derivative = function derivative(wrt) {
    var lhsd = this.lhs.derivative(wrt);
    var rhsd = this.rhs.derivative(wrt);
    return new SubtractionExpr(lhsd, rhsd);
};

function MultiplicationExpr(lhs, rhs) {
    BinaryExpr.call(this, "*", lhs, rhs);
}
MultiplicationExpr.prototype = Object.create(BinaryExpr.prototype);
MultiplicationExpr.prototype.constructor = MultiplicationExpr;
MultiplicationExpr.precedence = 50;
MultiplicationExpr.prototype.toLatexString = function toLatexString() {
    var lhsStr = this.maybeParenthesize(this.lhs, this.lhs.toLatexString());
    var rhsStr = this.maybeParenthesize(this.rhs, this.rhs.toLatexString());
    return lhsStr + " \\cdot{} " + rhsStr;
};
MultiplicationExpr.prototype.safeSimplify = function safeSimplify() {
    var lhsr = this.lhs.safeSimplify();
    var rhsr = this.rhs.safeSimplify();
    if (lhsr instanceof NumberExpr &&
        rhsr instanceof NumberExpr) {
        return new NumberExpr(lhsr.value * rhsr.value);
    } else if (isZero(lhsr) || isOne(rhsr)) return lhsr;
    else if (isZero(rhsr) || isOne(lhsr)) return rhsr;
    else {
        return new this.constructor(lhsr, rhsr);
    }
};
MultiplicationExpr.prototype.derivative = function derivative(wrt) {
    var lhsd = this.lhs.derivative(wrt);
    var rhsd = this.rhs.derivative(wrt);
    var left = new MultiplicationExpr(lhsd, this.rhs);
    var right = new MultiplicationExpr(this.lhs, rhsd);
    return new AdditionExpr(left, right);
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
    var lhsStr = this.maybeParenthesize(this.lhs, this.lhs.toLatexString());
    var rhsStr = this.maybeParenthesize(this.rhs, this.rhs.toLatexString());
    return "\\frac{" + lhsStr +
        "}{" + rhsStr + "}";
};
DivisionExpr.prototype.safeSimplify = function safeSimplify() {
    var lhsr = this.lhs.safeSimplify();
    var rhsr = this.rhs.safeSimplify();
    if (lhsr instanceof NumberExpr &&
        rhsr instanceof NumberExpr) {
        return new NumberExpr(lhsr.value / rhsr.value);
    } else if (isZero(lhsr) || isOne(rhsr)) return lhsr;
    else {
        return new this.constructor(lhsr, rhsr);
    }
};
DivisionExpr.prototype.derivative = function derivative(wrt) {
    var lhsd = this.lhs.derivative(wrt);
    var rhsd = this.rhs.derivative(wrt);
    var left = new MultiplicationExpr(lhsd, this.rhs);
    var right = new MultiplicationExpr(this.lhs, rhsd);
    var bottom = new ExponentiationExpr(this.rhs, new NumberExpr(2));
    return new DivisionExpr(new SubtractionExpr(left, right), bottom);
};

function ExponentiationExpr(lhs, rhs) {
    BinaryExpr.call(this, "^", lhs, rhs);
}
ExponentiationExpr.prototype = Object.create(BinaryExpr.prototype);
ExponentiationExpr.prototype.constructor = ExponentiationExpr;
ExponentiationExpr.precedence = 80;
ExponentiationExpr.rightAssociative = true;
ExponentiationExpr.prototype.toLatexString = function toLatexString() {
    var lhsStr = this.maybeParenthesize(this.lhs, this.lhs.toLatexString());
    var rhsStr = this.maybeParenthesize(this.rhs, this.rhs.toLatexString());
    return lhsStr + "^{" + rhsStr + "}";
};
ExponentiationExpr.prototype.safeSimplify = function safeSimplify() {
    var lhsr = this.lhs.safeSimplify();
    var rhsr = this.rhs.safeSimplify();
    if (lhsr instanceof NumberExpr &&
        rhsr instanceof NumberExpr) {
        return new NumberExpr(Math.pow(lhsr.value, rhsr.value));
    } else {
        return new this.constructor(lhsr, rhsr);
    }
};

// A unary operator expression
function UnaryExpr(operator, operand, isPrefix) {
    Expr.call(this);
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
    var opStr = this.maybeParenthesize(this.operand.toInputString());
    if (this.isPrefix) {
        return this.operator + opStr;
    } else {
        return opStr + this.operator;
    }
};
UnaryExpr.prototype.guessPrimaryVariable = function guessPrimaryVariable() {
    return this.operand.guessPrimaryVariable();
};
UnaryExpr.prototype.shouldParenthesize = function() {
    pureVirtual();
}
UnaryExpr.prototype.maybeParenthesize = function(str) {
    if (this.shouldParenthesize()) return "(" + str + ")";
    else return str;
}

// A unary prefix operator expression
function UnaryPrefixExpr(operator, operand, operatorOffset) {
    UnaryExpr.call(this, operator, operand, true);
}
UnaryPrefixExpr.prototype = Object.create(UnaryExpr.prototype);
UnaryPrefixExpr.prototype.constructor = UnaryPrefixExpr;
UnaryPrefixExpr.prototype.shouldParenthesize = function shouldParenthesize() {
    if (this.operand.constructor.precedence === undefined) return false;
    var less = this.operand.constructor.precedence < this.constructor.precedence;
    if (!less) return false;
    if (this.operand instanceof BinaryExpr) return true;
    if (this.operand instanceof UnaryPostfixExpr) return true;
    return false;
};
UnaryPrefixExpr.parse = function parse(parser) {
    var token = parser.next();
    var operand = parser.parse(this.precedence);
    return new this(operand);
}

function NegationExpr(operand, operatorOffset) {
    UnaryPrefixExpr.call(this, "-", operand, operatorOffset);
}
NegationExpr.prototype = Object.create(UnaryPrefixExpr.prototype);
NegationExpr.prototype.constructor = NegationExpr;
NegationExpr.precedence = 75;
NegationExpr.prototype.toLatexString = function toLatexString() {
    return "-" + this.maybeParenthesize(this.operand.toLatexString());
};
NegationExpr.prototype.safeSimplify = function safeSimplify() {
    var opr = this.operand.safeSimplify();
    if (opr instanceof NumberExpr) {
        return new NumberExpr(-opr.value);
    } else {
        return new NegationExpr(this.operand, this.operatorOffset);
    }
};

// A unary postfix operator expression
function UnaryPostfixExpr(operator, operand, operatorEnd) {
    UnaryExpr.call(this, operator, operand, false);
}
UnaryPostfixExpr.prototype = Object.create(UnaryExpr.prototype);
UnaryPostfixExpr.prototype.constructor = UnaryPostfixExpr;

// A symbolic derivative expression
function DerivativeExpr(subexpr, wrt) {
    Expr.call(this);
    this.subexpr = subexpr;
    this.wrt = wrt;
}
DerivativeExpr.prototype = Object.create(Expr.prototype);
DerivativeExpr.prototype.constructor = DerivativeExpr;
DerivativeExpr.prototype.toLatexString = function toLatexString() {
    return "\\frac{\\mathrm{d}}{\\mathrm{d}" + this.wrt + "}\\," +
        "\\left(" + this.subexpr.toLatexString() + "\\right)";
};
DerivativeExpr.prototype.toInputString = function toInputString() {
    return "derivative " + this.subexpr.toInputString() + " wrt " +
        this.wrt;
};
DerivativeExpr.prototype.guessPrimaryVariable = function guessPrimaryVariable() {
    return this.wrt;
};
DerivativeExpr.parse = function parse(parser) {
    parser.require("derivative");
    var subexpr = parser.parse(0);
    if (parser.peek() && parser.peek().str === "wrt") {
        parser.require("wrt");
        var wrtToken = parser.next();
        var wrt = wrtToken.str;
    } else {
        var wrt = subexpr.guessPrimaryVariable();
        if (!wrt) wrt = "x";
    }
    return new DerivativeExpr(subexpr, wrt);
};
DerivativeExpr.prototype.safeSimplify = function safeSimplify() {
    return this.subexpr.derivative(this.wrt).safeSimplify();
};

// A symbolic integral expression
function IntegralExpr(integrand, wrt) {
    Expr.call(this);
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
function IndefiniteIntegralExpr(integrand, wrt) {
    IntegralExpr.call(this, integrand, wrt);
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
function DefiniteIntegralExpr(integrand, from, to, wrt) {
    IntegralExpr.call(integrand, wrt);
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

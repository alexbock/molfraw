"use strict";

function prefixHandler(parser) {
    var token = parser.peek(0);
    if (token.kind === "name") {
        return VarExpr.parse(parser);
    } else if (token.kind === "number") {
        return NumericalLiteralExpr.parse(parser);
    } else if (token.str === "(") {
        return ParenExpr.parse(parser);
    }
}

function bindBinaryHandler(derivedExpr, parser) {
    var handler = BinaryExpr.parse.bind(derivedExpr, parser);
    handler.precedence = derivedExpr.precedence;
    handler.rightAssociative = derivedExpr.rightAssociative;
    return handler;
}

function infixHandlerFactory(parser) {
    var token = parser.peek(0);
    if (!token) return null;
    if (token.str === "+") {
        return bindBinaryHandler(AdditionExpr, parser);
    } else if (token.str === "-") {
        return bindBinaryHandler(SubtractionExpr, parser);
    } else if (token.str === "*") {
        return bindBinaryHandler(MultiplicationExpr, parser);
    } else if (token.str === "/") {
        return bindBinaryHandler(DivisionExpr, parser);
    } else if (token.str === "^") {
        return bindBinaryHandler(ExponentiationExpr, parser);
    }
}

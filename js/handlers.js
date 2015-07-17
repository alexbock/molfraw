"use strict";

function prefixHandler(parser) {
    var token = parser.peek(0);
    if (token.kind == "name") {
        return VarExpr.parse(parser);
    } else if (token.str == "(") {
        return ParenExpr.parse(parser);
    }
}

function postfixHandlerFactory(parser) {
    var token = parser.peek(0);
    if (token.str == "+") {
        return BinaryExpr.parse.bind(AdditionExpr, parser);
    }
}

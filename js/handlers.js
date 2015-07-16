"use strict";

function prefixHandler(parser) {
    var token = parser.peek(0);
    if (token.kind == "name") {
        return VarExpr.parse(parser);
    } else if (token.str == "(") {
        return ParenExpr.parse(parser);
    } else if (token.str == "+") {
        // TODO
    }
}

function postfixHandlerFactory(parser) {
    
}

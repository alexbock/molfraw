"use strict";

function Parser(tokens, prefixHandler, infixHandlerFactory) {
    this.tokens = tokens;
    this.index = 0;
    this.prefixHandler = prefixHandler;
    this.infixHandlerFactory = infixHandlerFactory;
}

Parser.prototype.peek = function peek(lookahead) {
    return this.tokens[this.index + lookahead];
};

Parser.prototype.next = function next() {
    return this.tokens[this.index++];
};

Parser.prototype.require = function require(str) {
    var token = this.next();
    if (!token) {
        throw new Error("expected '" + str + "'");
    } else if (token.str !== str) {
        throw new Error("expected '" + str + "', got '" + token.str + "'");
    }
    return token;
};

Parser.prototype.expect = function expect(str) {
    var token = this.next();
    if (!token) {
        var msg = "expected '" + str + "'";
        throw new DiagnosableError(msg, -1);
    } else if (token.str !== str) {
        var msg = "expected '" + str + "', got '" + token.str + "'";
        throw new DiagnosableError(msg, token.range.begin);
    }
    return token;
}

Parser.prototype.parse = function parse(precedence) {
    var expr = this.prefixHandler(this);
    for (var infixHandler = this.infixHandlerFactory(this);
         infixHandler && precedence < infixHandler.precedence;
         infixHandler = this.infixHandlerFactory(this)) {
        expr = infixHandler(expr);
    }
    return expr;
};

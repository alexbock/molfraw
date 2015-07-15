"use strict";

function Range(begin, end) {
    this.begin = begin;
    this.end = end;
}

function Token(kind, str, range) {
    this.kind = kind;
    this.str = str;
    this.range = range;
}

function TokenDescription(kind, regex) {
    this.kind = kind;
    this.regex = regex;
}

function Lexer(tokenDescriptions) {
    this.tokenDescriptions = tokenDescriptions;
    // sanity check
    this.tokenDescriptions.forEach(function (desc) {
        if (!desc.regex.global) {
            throw new Error("token regex must be global");   
        }
    });
}

Lexer.prototype.lex = function lex(str) {
    var tokens = [];
    var i = 0;
    while (i < str.length) {
        // skip whitespace
        if (str[i] == ' ' || str[i] == '\t') {
            ++i;
            continue;
        }
        // try to match every token description
        var token = null;
        this.tokenDescriptions.forEach(function(desc) {
            if (token !== null) return; // we already matched
            
            desc.regex.lastIndex = i;
            var result = desc.regex.exec(str);
            
            if (result === null) return; // no match
            if (result.index !== i) return; // matched too late
            
            var range = new Range(i, i + result[0].length);
            token = new Token(desc.kind, result[0], range);
        });
        if (token === null) {
            throw new DiagnosableError("no matching token", i);   
        }
        i += token.str.length;
        tokens.push(token);
    }
    return tokens;
};

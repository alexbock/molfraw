"use strict";

function Result(kind) {
    this.kind = kind;
}
Result.prototype.present = function present(parent) {
    pureVirtual();
};

function GroupResult(name, subresults) {
    Result.call(this, "group");
    this.name = name;
    this.subresults = subresults;
}
GroupResult.prototype = Object.create(Result.prototype);
GroupResult.prototype.constructor = GroupResult;
GroupResult.prototype.present = function present(parent) {
    var div = document.createElement("div");
    var span = document.createElement("span");
    span.appendChild(document.createTextNode(this.name + ":"));
    div.appendChild(span);
    parent.appendChild(div);
    div.appendChild(document.createElement("br"));
    var sub_div = document.createElement("div");
    sub_div.className = "subresult";
    div.appendChild(sub_div);
    this.subresults.forEach(function (subresult) {
        subresult.present(sub_div);
    });
};

function ErrorResult(error) {
    Result.call(this, "error");
    this.error = error;
}
ErrorResult.prototype = Object.create(Result.prototype);
ErrorResult.prototype.constructor = ErrorResult;
ErrorResult.prototype.present = function present(parent) {  
    var sadFaceDiv = document.createElement("div");
    sadFaceDiv.className = "sadFace";
    sadFaceDiv.appendChild(document.createTextNode(":("));
    parent.appendChild(sadFaceDiv);
    
    var sadTextDiv = document.createElement("div");
    sadTextDiv.className = "sadText";
    if (this.error instanceof DiagnosableError) {
        sadTextDiv.appendChild(document.createTextNode("Sorry, I don't understand."));
        sadTextDiv.appendChild(document.createElement("br"));
        sadTextDiv.appendChild(document.createElement("br"));
        sadTextDiv.appendChild(document.createTextNode("'" + this.error.message));
        if (this.error.offset == -1) {
            sadTextDiv.appendChild(document.createTextNode(" at end of input'"));
        } else {
            sadTextDiv.appendChild(document.createTextNode(" at offset " + this.error.offset + "'"));
        }
    } else {
        sadTextDiv.appendChild(document.createTextNode("Sorry, something went wrong."));
        sadTextDiv.appendChild(document.createElement("br"));
        sadTextDiv.appendChild(document.createTextNode("Please "));
        var link = document.createElement("a");
        link.innerHTML = "file a bug report";
        link.href = "https://github.com/alexbock/molfraw/issues";
        sadTextDiv.appendChild(link);
        sadTextDiv.appendChild(document.createTextNode(" and include the text below:"));
        sadTextDiv.appendChild(document.createElement("br"));
        sadTextDiv.appendChild(document.createElement("br"));
        sadTextDiv.appendChild(document.createTextNode("input: '" + document.getElementById("input").value + "'"));
        sadTextDiv.appendChild(document.createElement("br"));
        sadTextDiv.appendChild(document.createTextNode("message: '" + this.error.message + "'"));
    }

    parent.appendChild(sadTextDiv);
};

function LexerDebugResult(tokens) {
    Result.call(this, "lexerDebug");
    this.tokens = tokens;
}
LexerDebugResult.prototype = Object.create(Result.prototype);
LexerDebugResult.prototype.constructor = LexerDebugResult;
LexerDebugResult.prototype.present = function present(parent) {
    var list = document.createElement("ul");
    this.tokens.forEach(function (token) {
        var item = document.createElement("li");
        item.appendChild(document.createTextNode(token.kind + " '" + token.str + "'"));
        list.appendChild(item);
    });
    parent.appendChild(list);
};

function exprToHTMLParseTree(expr) {
    var result = "<li>";
    result += expr.constructor.name;
    result += "<ul>";
    for (var prop in expr) {
        if (expr[prop] instanceof Expr) {
            result += exprToHTMLParseTree(expr[prop]);
        }
    }
    result += "</ul>";
    result += "</li>";
    return result;
}

function ParserDebugResult(expr) {
    Result.call(this, "parserDebug");
    this.expr = expr;
}
ParserDebugResult.prototype = Object.create(Result.prototype);
ParserDebugResult.prototype.constructor = ParserDebugResult;
ParserDebugResult.prototype.present = function present(parent) {
    parent.appendChild(document.createTextNode("Parse Tree Feedback: "));
    parent.appendChild(document.createTextNode(this.expr.toInputString()));
    parent.appendChild(document.createElement("br"));
    parent.appendChild(document.createTextNode("Parse Tree: "));
    var list = document.createElement("ul");
    list.innerHTML = exprToHTMLParseTree(this.expr);
    parent.appendChild(list);
    parent.appendChild(document.createElement("br"));
    parent.appendChild(document.createTextNode("LaTeX Representation: "));
    var latex = this.expr.toLatexString();
    parent.appendChild(document.createTextNode("$$" + latex + "$$"));
    var safeSimplified = this.expr.safeSimplify();
    parent.appendChild(document.createTextNode("Safe Simplification LaTeX Representation: "));
    var safeSimplifiedLatex = safeSimplified.toLatexString();
    parent.appendChild(document.createTextNode("$$" + safeSimplifiedLatex + "$$"));
};

function PlainExprResult(expr) {
    Result.call(this, "plainExpr");
    this.expr = expr;
}
PlainExprResult.prototype = Object.create(Result.prototype);
PlainExprResult.prototype.constructor = PlainExprResult;
PlainExprResult.prototype.present = function present(parent) {
    parent.appendChild(document.createTextNode("$$" + this.expr.toLatexString() + "$$"));
    // add a link to input this result as a query
    var inputDiv = document.createElement("div");
    inputDiv.className = "resultIdempotentInput";
    var inputSpan = document.createElement("span");
    inputSpan.appendChild(document.createTextNode(this.expr.toInputString()));
    inputDiv.appendChild(inputSpan);
    parent.appendChild(inputDiv);
    inputSpan.onclick = function() {
        document.getElementById("input").value = inputSpan.innerHTML;
        Molfraw.execute();
    };
};

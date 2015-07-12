"use strict";

function Result(kind) {
    this.kind = kind;
}
Result.prototype.present = function present(parent) {
    throw new Error("pure virtual");
}

function GroupResult(name, subresults) {
    Result.call(this, "group");
    this.name = name;
    this.subresults = subresults;
}
GroupResult.prototype = Object.create(Result.prototype);
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
}

function ErrorResult(error) {
    Result.call(this, "error");
    this.error = error;
}
ErrorResult.prototype = Object.create(Result.prototype);
ErrorResult.prototype.present = function present(parent) {  
    var sadFaceDiv = document.createElement("div");
    sadFaceDiv.className = "sadFace";
    sadFaceDiv.appendChild(document.createTextNode(":("));
    parent.appendChild(sadFaceDiv);
    
    var sadTextDiv = document.createElement("div");
    sadTextDiv.className = "sadText";
    sadTextDiv.appendChild(document.createTextNode("Sorry, I don't understand."));
    sadTextDiv.appendChild(document.createElement("br"));
    sadTextDiv.appendChild(document.createElement("br"));
    sadTextDiv.appendChild(document.createTextNode("'" + this.error.message));
    sadTextDiv.appendChild(document.createTextNode(" at offset " + this.error.offset + "'"));
    parent.appendChild(sadTextDiv);
}

function LexerDebugResult(tokens) {
    Result.call(this, "lexerDebug");
    this.tokens = tokens;
}
LexerDebugResult.prototype = Object.create(Result.prototype);
LexerDebugResult.prototype.present = function present(parent) {
    var list = document.createElement("ul");
    this.tokens.forEach(function (token) {
        var item = document.createElement("li");
        item.appendChild(document.createTextNode(token.kind + " '" + token.str + "'"));
        list.appendChild(item);
    });
    parent.appendChild(list);
}

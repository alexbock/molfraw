"use strict";

var Molfraw = Molfraw || {};

Molfraw.tokenDescriptions = [
    new TokenDescription("keyword", /integral|integrate|of|from|to/gi),
    new TokenDescription("function", /sin|cos|tan|sqrt/g),
    new TokenDescription("name", /[a-z](?:_(?:[a-z]+|[0-9]+))?/gi),
    new TokenDescription("number", /[0-9]+(?:\.[0-9]+)?/g),
    new TokenDescription("symbol", /\+|-|\*|\/|\^|=|\(|\)/g)
];

Molfraw.displayResults = function displayResults(results) {
    var output = document.getElementById("output");
    output.className = "placeholderBlur";
    output.innerHTML = "";
    results.forEach(function (result) {
        result.present(output); 
    });
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,"output"]);
    MathJax.Hub.Queue(function () {
        output.className = "";
    });
};

Molfraw.execute = function execute() {
    var input = document.getElementById("input").value;
    if (!input.length) {
        return;
    }
    try {
        if (input == "__debug_die") throw new Error("unhandled exception test");
        var lexer = new Lexer(Molfraw.tokenDescriptions);
        var tokens = lexer.lex(input);
    } catch (e) {
        var errorResult = new ErrorResult(e);
        Molfraw.displayResults([ errorResult ]);
        return;
    }
    
    var lexerResult = new LexerDebugResult(tokens);
    var groupResult = new GroupResult("Lexer Raw View", [ lexerResult ]);
    Molfraw.displayResults([ groupResult ]);
};

Molfraw.handleGoButton = function handleGoButton() {
    event.preventDefault();
    Molfraw.execute();
};

Molfraw.preparePage = function preparePage() {
    var examples = document.getElementsByClassName("exampleMono");
    examples = Array.prototype.slice.call(examples);
    examples.forEach(function (example) {
        example.onclick = function() {
            document.getElementById("input").value = example.innerHTML;
            Molfraw.execute();
        };
    });
};

window.onload = function() { Molfraw.preparePage(); }

"use strict";

var Molfraw = Molfraw || {};

Molfraw.tokenDescriptions = [
    new TokenDescription("keyword", /integral|integrate|of|from|to|derivative|wrt/gi),
    new TokenDescription("function", /sin|cos|tan|sqrt/g),
    new TokenDescription("constant", /e|pi/g),
    new TokenDescription("name", /[a-z](?:_(?:[a-z]+|[0-9]+))?/gi),
    new TokenDescription("number", /[0-9]+(?:\.[0-9]+)?/g),
    new TokenDescription("symbol", /\+|-|\*|\/|\^|=|\(|\)/g)
];

Molfraw.displayResults = function displayResults(results) {
    var output = document.getElementById("output");
    output.className = "placeholderBlur";
    output.innerHTML = "";
    var first = true;
    results.forEach(function (result) {
        if (first) {
            first = false;
        } else {
            output.appendChild(document.createElement("hr"));
        }
        result.present(output); 
    });
    if (!window.MathJax) {
        // offline
        // TODO fallback to ascii math rendering
        output.className = "";
        return;
    }
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,"output"]);
    MathJax.Hub.Queue(function () {
        output.className = "";
    });
};

Molfraw.execute = function execute() {
    var debug = false;
    var input = document.getElementById("input").value;
    if (!input.length) {
        return;
    } else if (input.startsWith("debug")) {
        input = input.substr(5);
        debug = true;
    }
    try {
        if (input == "__debug_die") throw new Error("unhandled exception test");
        var lexer = new Lexer(Molfraw.tokenDescriptions);
        var tokens = lexer.lex(input);
        var parser = new Parser(tokens, prefixHandler, infixHandlerFactory);
        var expr = parser.parse(0);
        if (parser.index != tokens.length) {
            throw new DiagnosableError("extraneous tokens", -1);
        }

        if (debug) {
            var lexerResult = new LexerDebugResult(tokens);
            var lexerGroupResult = new GroupResult("Lexer Raw View", [ lexerResult ]);
            var parserResult = new ParserDebugResult(expr);
            var parserGroupResult = new GroupResult("Parser Raw View", [ parserResult ]);
            Molfraw.displayResults([ lexerGroupResult, parserGroupResult ]);
        } else {
            var inputExprResult = new PlainExprResult(expr);
            var inputExprGroupResult = new GroupResult("Input Interpretation", [ inputExprResult ]);
            var outputExprResult = new PlainExprResult(expr.safeSimplify());
            var outputExprGroupResult = new GroupResult("Result", [ outputExprResult ]);
            Molfraw.displayResults([ inputExprGroupResult, outputExprGroupResult ]);
        }
    } catch (e) {
        var errorResult = new ErrorResult(e);
        Molfraw.displayResults([ errorResult ]);
        return;
    }
};

Molfraw.handleGoButton = function handleGoButton() {
    event.preventDefault();
    Molfraw.execute();
};

Molfraw.preparePage = function preparePage() {
    // make examples clickable
    var examples = document.getElementsByClassName("exampleMono");
    examples = Array.prototype.slice.call(examples);
    examples.forEach(function (example) {
        example.onclick = function() {
            document.getElementById("input").value = example.innerHTML;
            Molfraw.execute();
        };
    });
    // set up go button mouse highlighting on non-touch devices
    // (mobile safari botches any sane attempts at hover detection)
    if (!("ontouchstart" in window)) {
        var goButton = document.getElementById("go");
        goButton.addEventListener("mouseenter", function() {
            goButton.className = "goHover";
        });
        goButton.addEventListener("mouseleave", function() {
            goButton.className = "";
        });
    }
};

window.onload = function() { Molfraw.preparePage(); }

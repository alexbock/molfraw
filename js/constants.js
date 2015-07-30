"use strict";

function Constant(name, latex, value) {
    this.name = name;
    this.latex = latex;
    this.value = value;
}

Constant.PI = new Constant("pi", "\\pi{}", Math.PI);
Constant.E = new Constant("e", "\\mathrm{e}", Math.E);
Constant.GOLDEN = new Constant("golden ratio", "\\varphi{}", (1 + Math.sqrt(5)) / 2);

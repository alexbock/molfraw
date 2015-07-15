"use strict";

function pureVirtual() {
    throw new Error("pure virtual");
}

function DiagnosableError(message, offset) {
    this.message = message;
    this.offset = offset;
}

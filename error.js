"use strict";

function DiagnosableError(message, offset) {
    this.message = message;
    this.offset = offset;
}

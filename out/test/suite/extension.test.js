"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
// import * as myExtension from '../extension';
suite('Extension Test Suite', () => {
    before(() => {
        vscode.window.showInformationMessage('Start all tests.');
    });
    test('Sample test', () => {
        assert.equal([1, 2, 3].indexOf(5), -1);
        assert.equal([1, 2, 3].indexOf(0), -1);
    });
});
//# sourceMappingURL=extension.test.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "auto-tag-html-i18n" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.autoAppendTagHTMLi18n', () => {
        // The code you place here will be executed every time your command is executed
        if (vscode.window.activeTextEditor !== undefined) {
            const strPath = vscode.window.activeTextEditor.document.uri.fsPath;
            let strPathSrc = strPath.substring(strPath.indexOf('\\src') + 5, strPath.lastIndexOf('\\'));
            var strId = strPathSrc.replace('.html', '')
                .replace(new RegExp(/\./g), '\\')
                .replace(new RegExp(/\\/g), '.');
            strId.split('.').forEach(strPart => {
                let strPartCamelCase = toCamelCase(strPart);
                if (strPart !== strPartCamelCase) {
                    strId = strId.replace(strPart, strPartCamelCase);
                }
            });
            const textEditor = vscode.window.activeTextEditor;
            const document = textEditor.document;
            const firstLine = document.lineAt(0);
            let lastLine = document.lineAt(document.lineCount - 1);
            let textRange = new vscode.Range(0, firstLine.range.start.character, document.lineCount - 1, lastLine.range.end.character);
            var html = document.getText(textRange);
            //get all control include i18n tag
            const i18nRegExpControl = /<(a|button|label|span|strong|th[^ead]|input|ng*).*?(i18n)-?(placeholder|title)?([^>]+)?>(.*?)<?([^>]+)?>?/gm;
            //for recheck type of i18n
            const i18nOnlyRegExp = /(i18n)([^-^=]+)/gm;
            const i18nRegExp = /(i18n)-(placeholder|title)([^=]+)/gm;
            //for text inside tag. Ex: <button>abc</button>
            const ctrlWithClosedTagRegExp = /<(a|button|label|span|strong|th)\s([^>]+)>(.*?)<([^>]+)>/gsm;
            //for text on placeholder or title. Ex: <button title='abc'></button>
            const ctrlWithoutClosedTagRegExp = /<(a|button|input|ng[x]?.*?)\s([^>]+)(title|placeholder)=("|')(.*?)("|')([^>]+)>/gsm;
            var matches = html.match(i18nRegExpControl);
            var iTry = 1;
            var iMaxTry = 5;
            if (matches !== null) {
                for (let i = 0; i < matches.length; i++) {
                    if (iTry === iMaxTry) {
                        iTry = 1;
                        continue;
                    }
                    let i18nHTMLControlTag = matches[i];
                    let i18Tag = i18nHTMLControlTag.match(i18nOnlyRegExp);
                    let tagRegex = i18nOnlyRegExp.exec(i18nHTMLControlTag);
                    var i18nId = '';
                    if (i18Tag !== null && tagRegex !== null) {
                        i18Tag = tagRegex[1];
                        i18nId = `@@${strId}`;
                        let mCtrl = ctrlWithClosedTagRegExp.exec(i18nHTMLControlTag);
                        if (mCtrl !== null) {
                            i18nId = `${i18nId}.${toCamelCase(mCtrl[1])}.${toCamelCase(mCtrl[3])}`;
                            iTry = 1;
                        }
                        else {
                            iTry++;
                            i--;
                            continue;
                        }
                    }
                    else {
                        i18Tag = i18nHTMLControlTag.match(i18nRegExp);
                        tagRegex = i18nRegExp.exec(i18nHTMLControlTag);
                        if (i18Tag !== null && tagRegex !== null) {
                            i18Tag = `${tagRegex[1]}-${tagRegex[2]}`;
                            i18nId = `@@${strId}`;
                            let mCtrl = ctrlWithoutClosedTagRegExp.exec(i18nHTMLControlTag);
                            if (mCtrl !== null) {
                                i18nId = `${i18nId}.${toCamelCase(mCtrl[1])}.${toCamelCase(mCtrl[3])}.${toCamelCase(mCtrl[5])}`;
                                iTry = 1;
                            }
                            else {
                                iTry++;
                                i--;
                                continue;
                            }
                        }
                    }
                    if (i18nId !== `@@${strId}` && i18nId !== '') {
                        i18nHTMLControlTag = i18nHTMLControlTag.replace(i18Tag, `${i18Tag}="${i18nId}"`);
                        html = html.replace(matches[i], i18nHTMLControlTag);
                    }
                }
            }
            textEditor.edit(function (editBuilder) {
                editBuilder.replace(textRange, html);
            });
            // Display a message box to the user
            vscode.window.showInformationMessage('Auto append i18n for HTML finished!');
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
function toCamelCase(text) {
    text = onlyWorld(text);
    const aSeparate = [' ', '-', '_', '|'];
    let separate = aSeparate.find(s => text.indexOf(s) > -1);
    if (separate !== undefined) {
        return text.split(separate).map((t, idx) => {
            //let tmp = t;
            if (idx === 0) {
                return t.charAt(0).toLowerCase() + t.slice(1);
            }
            else {
                return t.charAt(0).toUpperCase() + t.slice(1);
            }
        }).join('');
    }
    return text.toLowerCase();
}
exports.toCamelCase = toCamelCase;
function onlyWorld(text) {
    const worldOnlyRegExp = /\w+/gsm;
    const matches = text.match(worldOnlyRegExp);
    if (matches !== null) {
        return matches.join(' ');
    }
    return '';
}
exports.onlyWorld = onlyWorld;
//# sourceMappingURL=extension.js.map
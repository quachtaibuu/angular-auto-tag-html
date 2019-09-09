// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "auto-tag-html-i18n" is now active!');

	const i18nRegExpControl: RegExp = /<(a|b|h\d|button|label|span|strong|th[^ead]|ng*)[.|\s\w\W|\d]*?(i18n)-?(placeholder|title|label)?([^>]+)?>(.*?)<?([^>]+)?>?/gm;
			//for recheck type of i18n
	const i18nOnlyRegExp: RegExp = /(i18n)([^-^=]+)/gm;
	const i18nRegExp: RegExp = /(i18n)-(placeholder|title|label)([^=]+)/gm;
	const i18nRegExpAuto:RegExp = /(placeholder|title|label)=("|')(.*?)("|')([^>]+)>/gm;
	//for text inside tag. Ex: <button>abc</button>
	const ctrlWithClosedTagRegExp: RegExp = /<(a|b|h\d|button|label|span|strong|th)\s([^>]+)>(.*?)<([^>]+)>/gsm;
	//for text on placeholder or title. Ex: <button title='abc'></button>
	const ctrlWithoutClosedTagRegExp: RegExp = /<(a|button|input|img|ng[x]?.*?)\s([^>]*)(title|placeholder|label)=("|')(.*?)("|')([^>]+)>/gm;

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.autoAppendTagHTMLi18n', () => {
		// The code you place here will be executed every time your command is executed
		if (vscode.window.activeTextEditor !== undefined) {
			const strPath: string = vscode.window.activeTextEditor.document.uri.fsPath;
			let strPathSrc = strPath.substring(strPath.indexOf('\\src') + 5, strPath.lastIndexOf('\\'));
			var strId: string = strPathSrc.replace('.html', '')
				.replace(new RegExp(/\./g), '\\')
				.replace(new RegExp(/\\/g), '.');
			strId.split('.').forEach(strPart => {
				let strPartCamelCase = toCamelCase(strPart);
				if (strPart !== strPartCamelCase) {
					strId = strId.replace(strPart, strPartCamelCase);
				}
			});

			const textEditor = vscode.window.activeTextEditor;
			const document: vscode.TextDocument = textEditor.document;
			const firstLine: vscode.TextLine = document.lineAt(0);
			let lastLine: vscode.TextLine = document.lineAt(document.lineCount - 1);
			let textRange: vscode.Range = new vscode.Range(0,
				firstLine.range.start.character,
				document.lineCount - 1,
				lastLine.range.end.character);

			var html = document.getText(textRange);
			//get all control include i18n tag
			
			var matches: any = html.match(i18nRegExpControl);
			
			if (matches !== null) {
				html=InsertI18n(matches,strId,html);
			}
			var matchesWithoutClosedtag=html.match(ctrlWithoutClosedTagRegExp);
			if(matchesWithoutClosedtag !== null){
				html=InsertI18n(matchesWithoutClosedtag,strId,html);
			}


			textEditor.edit(function (editBuilder: vscode.TextEditorEdit) {
				editBuilder.replace(textRange, html);
			});

			// Display a message box to the user
			vscode.window.showInformationMessage('Auto append i18n for HTML finished!');
		}
	});

	context.subscriptions.push(disposable);
	function InsertI18n(matches:any[],strId:string,html:string){
		var iTry = 1;
		var iMaxTry = 5;
		for (let i = 0; i < matches.length; i++) {
			
			if(iTry === iMaxTry) {
				iTry = 1;
				continue;
			}
	
			let i18nHTMLControlTag = matches[i];
			let i18Tag = i18nHTMLControlTag.match(i18nOnlyRegExp);
			let tagRegex = i18nOnlyRegExp.exec(i18nHTMLControlTag);
			var i18nId: string = '';
	
			if (i18Tag !== null && tagRegex !== null) {
				i18Tag = tagRegex[1];
				i18nId = `@@${strId}`;
				let mCtrl = ctrlWithClosedTagRegExp.exec(i18nHTMLControlTag);
				if (mCtrl !== null) {
					i18nId = `${i18nId}.${toCamelCase(mCtrl[1])}.${toCamelCase(mCtrl[3])}`;
					iTry = 1;
				}else {
					iTry++;
					i--;
					continue;
				}
			} else {
				i18Tag = i18nHTMLControlTag.match(i18nRegExp);
				tagRegex = i18nRegExp.exec(i18nHTMLControlTag);
	
				if (i18Tag !== null && tagRegex !== null) {							
					i18Tag = `${tagRegex[1]}-${tagRegex[2]}`;
					i18nId = `@@${strId}`;
					let mCtrl = ctrlWithoutClosedTagRegExp.exec(i18nHTMLControlTag);
					if (mCtrl !== null) {
						i18nId = `${i18nId}.${toCamelCase(mCtrl[1])}.${toCamelCase(mCtrl[3])}.${toCamelCase(mCtrl[5])}`;
						iTry = 1;
					}else {
						iTry++;
						i--;
						continue;
					}
				}
				else{
					let auto = i18nRegExpAuto.exec(i18nHTMLControlTag);
					let i18n=/(i18n)([^-^=]+)?/gm.exec(i18nHTMLControlTag);
					if(auto !== null && i18n === null){
						
						i18Tag=`i18n-${auto[1]} ${auto[1]}`;
						let newtag=matches[i].replace(auto[1],i18Tag);
						html=html.replace(matches[i],newtag);
					}
				}
			}
	
			if (i18nId !== `@@${strId}` && i18nId !== '') {
				i18nHTMLControlTag = i18nHTMLControlTag.replace(i18Tag, `${i18Tag}="${i18nId}"`);
				html = html.replace(matches[i], i18nHTMLControlTag);
			}
		}
		return html;
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }

export function toCamelCase(text: string) {
	text = onlyWorld(text);
	const aSeparate: string[] = [' ', '-', '_', '|'];
	let separate = aSeparate.find(s => text.indexOf(s) > -1);
	if (separate !== undefined) {
		return text.split(separate).map(
			(t, idx) => {
				//let tmp = t;
				if (idx === 0) {
					return t.charAt(0).toLowerCase() + t.slice(1);
				} else {
					return t.charAt(0).toUpperCase() + t.slice(1);
				}
			}
		).join('');
	}
	return text.toLowerCase();
}

export function onlyWorld(text: string) {
	const worldOnlyRegExp: RegExp = /\w+/gsm;
	const matches = text.match(worldOnlyRegExp);
	if (matches !== null) {
		return matches.join(' ');
	}
	return '';
}
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand(
        'code-svg.preview',
        () => {
            const panel = vscode.window.createWebviewPanel(
                'code-svg.preview',
                `Preview ${
                    vscode
                        .window
                        .activeTextEditor
                        ?.document
                        .fileName
                        .split('/')
                        .at(-1)
                }`,
                vscode.ViewColumn.Beside,
                {}
            );
            panel.webview.html = svgPreviewHTML();
        }
    );

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function svgPreviewHTML() {
    let text = vscode.window.activeTextEditor?.document.getText();
    return text == null ? HTML("No file opened") : HTML(text);
}

function HTML(content: String) {
    return `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >
            <title>code-svg html</title>
        </head>
        <body>
            ${content}
        </body>
    </html>`;
}

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand(
        'code-svg.preview',
        () => svgPreviewCommand(context)
    );

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function svgPreviewCommand(context: vscode.ExtensionContext) {
    let file = vscode.window.activeTextEditor?.document;
    if (file == undefined) {
        vscode.window.showErrorMessage("No active docuent");
        return;
    }

    let id = getId(context);
    let fileName = file.fileName;

    setDis(context, id, vscode.workspace.onDidSaveTextDocument((e) => {
        if (e.fileName == fileName) {
            svgFileChange(context, e, id);
        }
    }));

    const panel = vscode.window.createWebviewPanel(
        'code-svg.preview',
        `Preview ${
            fileName.split('/').at(-1)
        }`,
        vscode.ViewColumn.Beside,
        {}
    );

    panel.webview.html = svgPreviewHTML(file);
    panel.onDidDispose(() => {
        setDis(context, id, null);
    })

    // save the panel
    let may_panels = context.workspaceState.get("panels");
    let panels = getPanels(context);
    panels[id] = panel;
    context.workspaceState.update("panels", panels);
}

function svgFileChange(context: vscode.ExtensionContext, file: vscode.TextDocument, id: number) {
    let panel = getPanel(context, id)!;
    panel.webview.html = svgPreviewHTML(file);
}

function getPanels(context: vscode.ExtensionContext):
    { [id: number]: vscode.WebviewPanel }
{
    let may_panels = context.workspaceState.get("panels");
    return may_panels == null
        ? {}
        : may_panels as { [id: number]: vscode.WebviewPanel }
}

function setPanels(
    context: vscode.ExtensionContext,
    panels: { [id: number]: vscode.WebviewPanel })
{
    context.workspaceState.update("panels", panels);
}

function setPanel(
    context: vscode.ExtensionContext,
    id: number,
    panel: vscode.WebviewPanel | null)
{
    let panels = getPanels(context);
    panels[id] = panel!;
    setPanels(context, panels);
}

function getPanel(context: vscode.ExtensionContext, id: number): vscode.WebviewPanel | null {
    return getPanels(context)[id];
}

function getDiss(context: vscode.ExtensionContext):
    { [id: number]: vscode.Disposable }
{
    let may_panels = context.workspaceState.get("diss");
    return may_panels == null
        ? {}
        : may_panels as { [id: number]: vscode.Disposable }
}

function setDiss(
    context: vscode.ExtensionContext,
    diss: { [id: number]: vscode.Disposable })
{
    context.workspaceState.update("diss", diss);
}

function setDis(
    context: vscode.ExtensionContext,
    id: number,
    panel: vscode.Disposable | null)
{
    let diss = getDiss(context);
    let dis = diss[id];
    if (dis != null) {
        dis.dispose();
    }
    diss[id] = panel!;
    setDiss(context, diss);
}

function getDis(context: vscode.ExtensionContext, id: number): vscode.Disposable | null {
    return getDiss(context)[id];
}

function getId(context: vscode.ExtensionContext): number {
    let id = context.workspaceState.get("id") as number;
    if (id == null) {
        context.workspaceState.update("id", 1);
        return 0;
    }
    const MAX_IDS = Math.pow(2,50) - 1;
    context.workspaceState.update("id", id >= MAX_IDS ? 0 : id + 1);
    return id;
}

function svgPreviewHTML(file: vscode.TextDocument) {
    // TODO: verify svg ? starts with / regex / extension ?
    return HTML(file.getText());
}

function HTML(content: string) {
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

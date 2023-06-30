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

class SvgView {
    panel: vscode.WebviewPanel;
    diss: Array<vscode.Disposable>;

    constructor(p: vscode.WebviewPanel) {
        this.panel = p;
        this.diss = [];
    }

    detach() {
        this.diss.forEach(d => {
            d.dispose();
        });
    }
}

let views: Array<SvgView> = [];

function svgPreviewCommand(context: vscode.ExtensionContext) {
    let file = vscode.window.activeTextEditor?.document;
    if (file == undefined) {
        vscode.window.showErrorMessage("No active docuent");
        return;
    }

    let fileName = file.fileName;

    let view = new SvgView(vscode.window.createWebviewPanel(
        'code-svg.preview',
        `Preview ${
            fileName.split('/').at(-1)
        }`,
        vscode.ViewColumn.Beside,
        {
            enableScripts: true
        }
    ));

    view.diss.push(vscode.workspace.onDidSaveTextDocument((e) => {
        if (e.fileName == fileName) {
            svgFileChange(context, e, view);
        }
    }));

    views.push(view);

    view.panel.webview.html = svgPreviewHTML(file);
    view.panel.onDidDispose(() => {
        view.detach();
        let i = views.indexOf(view);
        views.splice(i, 1);
    });
}

function svgFileChange(context: vscode.ExtensionContext, file: vscode.TextDocument, view: SvgView) {
    view.panel.webview.postMessage({ action: "update", content: file.getText() });
}

function svgPreviewHTML(file: vscode.TextDocument) {
    // TODO: verify svg ? starts with / regex / extension ?
    let svg = file.getText();
    return HTML(`
    <div style="overflow: visible; display: block;" class="scrl">
        <div class="svg-view" style="display: block; position: relative; height: 100%; width: 100%; top: 0px; left: 0px;">
            ${svg}
        </div>
    </div>
    <script>
        const scrlRatio = 0.003;
        let svg = document.querySelector(".svg-view");
        let scrl = document.querySelector(".scrl");

        let mx = 0;
        let my = 0;

        window.addEventListener("wheel", (e) => {
            e.preventDefault();

            console.log("m:", mx, my);

            // old relative position of mouse relative to the svg
            let rect = svg.getBoundingClientRect();
            let ox = (mx - rect.x) / rect.width;
            let oy = (my - rect.y) / rect.height;

            // zoom
            svg.style.height = addp(svg.style.height, -scrlRatio * e.deltaY * getp(svg.style.height, "%"), "%");
            svg.style.width = addp(svg.style.width, -scrlRatio * e.deltaY * getp(svg.style.width, "%"), "%");

            rect = svg.getBoundingClientRect();

            // new relative position of mouse relative to the svg
            let nx = (mx - rect.x) / rect.width;
            let ny = (my - rect.y) / rect.height;

            let dx = nx - ox;
            let dy = ny - oy;

            svg.style.left = addp(svg.style.left, rect.width * dx, "px");
            svg.style.top = addp(svg.style.top, rect.height * dy, "px");
        }, { passive: false });

        svg.addEventListener("mousemove", (e) => {
            if (e.buttons != 1) {
                return;
            }

            svg.style.left = addp(svg.style.left, e.movementX, "px");
            svg.style.top = addp(svg.style.top, e.movementY, "px");
        });

        window.addEventListener("message", (e) => {
            switch (e.data.action) {
                case "update":
                    svg.innerHTML = e.data.content;
                    break;
            }
        });

        window.addEventListener("mousemove", (e) => {
            mx = e.pageX;
            my = e.pageY;
        });

        function getp(s, u) {
            return parseFloat(s.substring(0, s.length - u.length));
        }

        function addp(s, a, u) {
            let n = getp(s, u);
            return \`\${n + a}\${u}\`;
        }
    </script>
    `);
}

function HTML(content: string, head?: string) {
    return `<!DOCTYPE html>
    <html lang="en" style="padding: 0; margin: 0;">
        <head>
            <meta charset="UTF-8">
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >
            <title>code-svg html</title>
            ${head ?? ''}
        </head>
        <body style="display:block; width: 100vw; height=100vh; padding: 0; margin: 0; overflow: hidden">
            ${content}
        </body>
    </html>`;
}

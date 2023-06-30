// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

class SvgView implements vscode.Disposable {
    panel: vscode.WebviewPanel;
    diss: DisposableArray<vscode.Disposable> = new DisposableArray();

    constructor(p: vscode.WebviewPanel) {
        this.panel = p;
    }

    dispose() {
        this.diss.dispose();
    }
}

class DisposableArray<T extends vscode.Disposable> implements vscode.Disposable {
    arr: Array<T> = [];

    dispose() {
        this.arr.forEach(d => d.dispose());
    }
}

let views: DisposableArray<SvgView> = new DisposableArray();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand(
        'code-svg.preview',
        () => svgPreviewCommand(context)
    );

    context.subscriptions.push(disposable);
    context.subscriptions.push(views);
}

// This method is called when your extension is deactivated
export function deactivate() {}

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

    view.diss.arr.push(vscode.workspace.onDidSaveTextDocument((e) => {
        if (e.fileName == fileName) {
            svgFileChange(e, view);
        }
    }));

    views.arr.push(view);

    view.panel.webview.html = svgPreviewHTML(file);
    view.panel.onDidDispose(() => {
        view.dispose();
        let i = views.arr.indexOf(view);
        views.arr.splice(i, 1);
    });
}

function svgFileChange(file: vscode.TextDocument, view: SvgView) {
    view.panel.webview.postMessage({ action: "update", content: file.getText() });
}

function svgPreviewHTML(file: vscode.TextDocument) {
    // TODO: verify svg ? starts with / regex / extension ?
    let svg = file.getText();
    return HTML(`
    <div class="menu" style="height: 2em; display: flex; align-items: center;  border-bottom: solid 1px gray;">
        <div style="width: calc(1.5em - 2px); margin-left: 0.25em; height: calc(1.5em - 2px); border: gray solid 1px; background-color: transparent;" onclick="setBg('none')"></div>
        <div style="width: calc(1.5em - 2px); margin-left: 0.25em; height: calc(1.5em - 2px); border: gray solid 1px; background-color: black;" onclick="setBg('linear-gradient(black, black)')"></div>
        <div style="width: calc(1.5em - 2px); margin-left: 0.25em; height: calc(1.5em - 2px); border: gray solid 1px; background-color: white;" onclick="setBg('linear-gradient(white, white)')"></div>
        <div style="width: calc(1.5em - 2px); margin-left: 0.25em; height: calc(1.5em - 2px); border: gray solid 1px; background-repeat: repeat; background-size: 20px 20px; background-image: conic-gradient(#222 0 90deg, #444 0 180deg, #222 0 270deg, #444 0)" onclick="setBg('conic-gradient(#222 0 90deg, #444 0 180deg, #222 0 270deg, #444 0)')"></div>
        <div style="width: calc(1.5em - 2px); margin-left: 0.25em; height: calc(1.5em - 2px); border: gray solid 1px; background-repeat: repeat; background-size: 20px 20px; background-image: conic-gradient(#CCC 0 90deg, #EEE 0 180deg, #CCC 0 270deg, #EEE 0)" onclick="setBg('conic-gradient(#CCC 0 90deg, #EEE 0 180deg, #CCC 0 270deg, #EEE 0)')"></div>
        <div style="width: calc(1.5em - 2px); margin-left: 0.25em; height: calc(1.5em - 2px);"><input type="checkbox" onclick="toggleBg()"></div>
    </div>
    <div style="overflow: hidden; display: block; height: calc(100% - 2em - 1px); background-repeat: repeat; background-size: 20px 20px; background-image: none;" class="scrl">
        <div class="svg-view" style="display: block; position: relative; width: 100%; top: 0px; left: 0px; background-repeat: repeat; background-size: 20px 20px; background-image: none;">
        ${svg}
        </div>
    </div>
    <script>
        const scrlRatio = 0.003;
        let svg = document.querySelector(".svg-view");
        let scrl = document.querySelector(".scrl");
        let bge = [svg, scrl];
        let bgi = 1;

        let mx = 0;
        let my = 0;

        scrl.addEventListener("wheel", (e) => {
            e.preventDefault();

            console.log("m:", mx, my);

            // old relative position of mouse relative to the svg
            let rect = svg.getBoundingClientRect();
            let ox = (mx - rect.x) / rect.width;
            let oy = (my - rect.y) / rect.height;

            // zoom
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

        scrl.addEventListener("mousemove", (e) => {
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

        function setBg(bg) {
            bge[bgi].style.backgroundImage = bg;
        }

        function toggleBg() {
            let cur = bge[bgi].style.backgroundImage;
            setBg('none');
            bgi = (bgi + 1) % 2;
            setBg(cur);
        }

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
        <body style="display:block; width: 100vw; height: 100vh; padding: 0; margin: 0; overflow: hidden">
            ${content}
        </body>
    </html>`;
}

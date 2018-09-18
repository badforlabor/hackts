import { readFileSync, writeFileSync, fstat } from "fs";
import * as fs from "fs";
import * as ts from "typescript";
import { PatchWorker } from "./patch";

let collect = {}

export function delint(sourceFile: ts.SourceFile) {
    delintNode(sourceFile);

    function delintNode(node: ts.Node) {

        let exp = (a, b, c, d) => {
            collect[node.kind] = node.kind
            //console.log(ts.SyntaxKind[node.kind], a, b, c)
        }
        exp(1, 2, 3, exp)

        if (node.kind === ts.SyntaxKind.FunctionDeclaration
            || node.kind === ts.SyntaxKind.FunctionExpression
            || node.kind === ts.SyntaxKind.FunctionKeyword
            || node.kind === ts.SyntaxKind.FunctionType
            || node.kind === ts.SyntaxKind.ArrowFunction
            || node.kind === ts.SyntaxKind.JSDocFunctionType) {
            //console.log("代码段：----------------------------------------", ts.SyntaxKind[node.kind])
            //console.log(node.getFullText())
            //console.log("----------------------------------------")
        }

        ts.forEachChild(node, delintNode);
    }

    function report(node: ts.Node, message: string) {
        let { line, character } = sourceFile.getLineAndCharacterOfPosition(
            node.getStart()
        );
        console.log(
            `${sourceFile.fileName} (${line + 1},${character + 1}): ${message}`
        );
    }
}

const fileNames = process.argv.slice(2);
fileNames.forEach(fileName => {
    // Parse a file
    let sourceFile = ts.createSourceFile(
        fileName,
        readFileSync(fileName).toString(),
        ts.ScriptTarget.ES2015,
    /*setParentNodes */ true
    );

    // delint it
    delint(sourceFile);

    let modify = new PatchWorker().doPatch(sourceFile)
    let output = fileName + ".mod"
    writeFileSync(output, modify)
});

var keys = Object.keys(collect)
for (let i = 0; i < keys.length; i++) {
    let key = keys[i]
    console.log(ts.SyntaxKind[parseInt(key)])
}


// 处理文件夹
let path = 'C:\\Users\\liubo\\liubo\\gitee\\ilovehue-full\\ilovehue\\assets\\Script'


function readDirctory(path: string, output: string[]) {
    let files = fs.readdirSync(path)
    for (let i = 0; i < files.length; i++) {
        let file = path + "\\" + files[i]
        let s = fs.statSync(file)
        if (s.isFile()) {
            output.push(file)
        } else {
            readDirctory(file, output)
        }
    }
}

let files: string[] = []
readDirctory(path, files)

// 备份成.ts.mod
for (let i = 0; i < files.length; i++) {
    let file = files[i]
    if (file.endsWith('.ts')) {
        if (fs.existsSync(file + '.mod')) {
            continue
        } else {
            // 备份成ts.mod文件
            fs.writeFileSync(file + '.mod', fs.readFileSync(file))
        }
    }
}

files.length = 0
readDirctory(path, files)

// 处理.ts.mod文件
for (let i = 0; true && i < files.length; i++) {
    let fileName = files[i]

    let ext = '.ts.mod'
    if (!fileName.endsWith(ext)) {
        continue
    }
    let output = fileName.substr(0, fileName.length - ext.length) + '.ts'

    let sourceFile = ts.createSourceFile(
        fileName,
        readFileSync(fileName).toString(),
        ts.ScriptTarget.ES2015,
    /*setParentNodes */ true
    );
    let modify = new PatchWorker().doPatch(sourceFile)
    fs.writeFileSync(output, modify)
}


console.log('files.length=', files.length)



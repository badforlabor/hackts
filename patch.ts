import * as ts from "typescript";

class PatchInfo {
    head: boolean  // 是否是开头
    pos: number       // 需要插入内容的位置
    cnt: number

    constructor(head, pos, cnt) {
        this.head = head
        this.pos = pos;
        this.cnt = cnt
    }
}

function dopatch(info: PatchInfo): string {
    let ret = '\n'

    let v = 0x0000ffff

    if (info.head) {

        ret += 'cc._x_x_ = cc._x_x_ || 0;\n'
        for (let i = 0; i < info.cnt; i++) {
            ret += 'cc._x_x_ += ' + Math.random() * v + ';\n'
        }

    } else {

        for (let i = 0; i < info.cnt; i++) {
            ret += 'cc._x_x_ += ' + Math.random() * v + ';\n'
        }
        ret += 'console.log("_x_x_", cc._x_x_);\n'
    }

    return ret
}


export class PatchWorker {

    // 由小到大排序
    _patchInfo: PatchInfo[] = []

    constructor() {
    }

    _push(head, pos, cnt) {

        let idx = this._patchInfo.length
        for (let i = 0; i < this._patchInfo.length; i++) {
            if (pos < this._patchInfo[i].pos) {
                idx = i
                break
            }
        }

        this._patchInfo.splice(idx, 0, new PatchInfo(head, pos, cnt))
    }

    doPatch(src: ts.SourceFile): string {

        let source = src.text
        let scope = this;

        function walk(node: ts.Node) {

            if (node.kind === ts.SyntaxKind.FunctionDeclaration
                || node.kind === ts.SyntaxKind.FunctionExpression
                || node.kind === ts.SyntaxKind.FunctionKeyword
                // || node.kind === ts.SyntaxKind.FunctionType
                || node.kind === ts.SyntaxKind.ArrowFunction
                || node.kind === ts.SyntaxKind.JSDocFunctionType) {

                if (!node.body) {
                    console.log("error!", source.substr(node.pos, node.end))
                } else {

                    let txt = source.substr(node.pos, node.end - node.pos)
                    if (txt.includes("{") && txt.includes("}")) {
                        let cnt = Math.max(1, (node.end - node.pos) / 100)
                        scope._push(true, node.body.pos, cnt)
                        scope._push(false, node.body.end, cnt)
                    }
                }
            }

            ts.forEachChild(node, walk);
        }

        walk(src)


        // 开始打补丁
        let modify = '';

        let patchBegin = ';var xxxx = 0; xxxx += 1;'
        let patchEnd = ';xxxx += 1;'

        patchBegin = '\nconsole.log("begin");\n'
        patchEnd = '\nconsole.log("end");\n'

        let last = 0
        for (let i = 0; i < this._patchInfo.length; i++) {
            let it = this._patchInfo[i]

            if (it.head) {

                // 在括号之后打补丁
                modify += source.substr(last, it.pos + 2 - last)
                last = it.pos + 2

                if (false) {
                    let cnt = 0;
                    while (cnt < it.cnt) {
                        modify += patchBegin
                        cnt++;
                    }
                }
                modify += dopatch(it)

            } else {
                modify += source.substr(last, it.pos - 1 - last)
                last = it.pos - 1

                // 在括号之前打补丁
                if (false) {
                    let cnt = 0;
                    while (cnt < it.cnt) {
                        modify += patchEnd
                        cnt++;
                    }
                }
                modify += dopatch(it)

                modify += source.substr(last, 1)
                last += 1
            }
        }

        // 剩余的内容
        modify += source.substr(last, source.length - last)

        return modify
    }
}

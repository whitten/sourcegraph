import { createWebWorkerMessageTransports } from 'cxp/module/jsonrpc2/transports/webWorker'
import { InitializeResult } from 'cxp/module/protocol'
import { TextDocumentDecoration } from 'cxp/module/protocol/decorations'
import { createConnection } from 'cxp/module/server/server'

const connection = createConnection(createWebWorkerMessageTransports(self as DedicatedWorkerGlobalScope))
connection.onInitialize(
    () =>
        ({
            capabilities: { decorationProvider: { static: true } },
        } as InitializeResult)
)

connection.onRequest(
    'textDocument/decoration',
    (): TextDocumentDecoration[] =>
        ['cyan', 'magenta', 'yellow', 'black'].map(
            (color, i) =>
                ({
                    range: { start: { line: i, character: 0 }, end: { line: i, character: 0 } },
                    isWholeLine: true,
                    backgroundColor: color,
                } as TextDocumentDecoration)
        )
)
connection.listen()
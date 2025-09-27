import { describe, it } from 'node:test';
import { anything, anyFunction, instance, mock, verify, when } from 'ts-mockito';
import querystring from 'node:querystring';
import WebSocket from 'isomorphic-ws';

import { CallAwaiter } from './test/index.js';
import { KubeConfig } from './config.js';
import { Exec } from './exec.js';
import { Cp } from './cp.js';
import { WebSocketHandler, WebSocketInterface } from './web-socket-handler.js';

describe('Cp', () => {
    describe('cpFromPod', () => {
        it('should run create tar command to a url', async () => {
            const kc = new KubeConfig();
            const fakeWebSocket: WebSocketInterface = mock(WebSocketHandler);
            const exec = new Exec(kc, instance(fakeWebSocket));
            const cp = new Cp(kc, exec);

            const namespace = 'somenamespace';
            const pod = 'somepod';
            const container = 'container';
            const srcPath = '/';
            const tgtPath = '/';
            const cmdArray = ['tar', 'zcf', '-', srcPath];
            const path = `/api/v1/namespaces/${namespace}/pods/${pod}/exec`;

            const query = {
                stdout: true,
                stderr: true,
                stdin: false,
                tty: false,
                command: cmdArray,
                container,
            };
            const queryStr = querystring.stringify(query);

            await cp.cpFromPod(namespace, pod, container, srcPath, tgtPath);
            verify(fakeWebSocket.connect(`${path}?${queryStr}`, null, anyFunction())).called();
        });

        it('should run create tar command to a url with cwd', async () => {
            const kc = new KubeConfig();
            const fakeWebSocket: WebSocketInterface = mock(WebSocketHandler);
            const exec = new Exec(kc, instance(fakeWebSocket));
            const cp = new Cp(kc, exec);

            const namespace = 'somenamespace';
            const pod = 'somepod';
            const container = 'container';
            const srcPath = '/';
            const tgtPath = '/';
            const cwd = '/abc';
            const cmdArray = ['tar', 'zcf', '-', '-C', cwd, srcPath];
            const path = `/api/v1/namespaces/${namespace}/pods/${pod}/exec`;

            const query = {
                stdout: true,
                stderr: true,
                stdin: false,
                tty: false,
                command: cmdArray,
                container,
            };
            const queryStr = querystring.stringify(query);

            await cp.cpFromPod(namespace, pod, container, srcPath, tgtPath, cwd);
            verify(fakeWebSocket.connect(`${path}?${queryStr}`, null, anyFunction())).called();
        });
    });

    describe('cpToPod', () => {
        it('should run extract tar command to a url', async () => {
            const kc = new KubeConfig();
            const fakeWebSocketInterface: WebSocketInterface = mock(WebSocketHandler);
            const fakeWebSocket: WebSocket.WebSocket = mock(WebSocket) as WebSocket.WebSocket;
            const callAwaiter: CallAwaiter = new CallAwaiter();
            const exec = new Exec(kc, instance(fakeWebSocketInterface));
            const cp = new Cp(kc, exec);

            const namespace = 'somenamespace';
            const pod = 'somepod';
            const container = 'container';
            const srcPath = 'testdata/archive.txt';
            const tgtPath = '/';
            const cmdArray = ['tar', 'xf', '-', '-C', tgtPath];
            const path = `/api/v1/namespaces/${namespace}/pods/${pod}/exec`;

            const query = {
                stdout: false,
                stderr: true,
                stdin: true,
                tty: false,
                command: cmdArray,
                container,
            };
            const queryStr = querystring.stringify(query);

            const fakeConn: WebSocket.WebSocket = instance(fakeWebSocket);
            when(fakeWebSocketInterface.connect(`${path}?${queryStr}`, null, anyFunction())).thenResolve(
                fakeConn,
            );
            when(fakeWebSocket.send(anything())).thenCall(callAwaiter.resolveCall('send'));
            when(fakeWebSocket.close()).thenCall(callAwaiter.resolveCall('close'));

            await cp.cpToPod(namespace, pod, container, srcPath, tgtPath);
            verify(fakeWebSocketInterface.connect(`${path}?${queryStr}`, null, anyFunction())).called();
        });
    });
});

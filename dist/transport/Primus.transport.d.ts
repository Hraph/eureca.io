/// <reference path="../EObject.class.d.ts" />
/// <reference path="../Util.class.d.ts" />
/// <reference path="../Transport.d.ts" />
/// <reference path="../IServer.interface.d.ts" />
/// <reference path="../ISocket.interface.d.ts" />
import { EObject } from "../EObject.class";
import { ISocket } from "../ISocket.interface";
import { IServer } from "../IServer.interface";
export declare class Socket extends EObject implements ISocket {
    socket?: any;
    request: any;
    id: any;
    remoteAddress: any;
    eureca: any;
    constructor(socket?: any);
    private bindEvents;
    isAuthenticated(): boolean;
    send(data: any): void;
    close(): void;
    onopen(callback: (any?: any) => void): void;
    onmessage(callback: (any?: any) => void): void;
    onclose(callback: (any?: any) => void): void;
    onerror(callback: (any?: any) => void): void;
    ondisconnect(callback: (any?: any) => void): void;
}
export declare class Server implements IServer {
    primus: any;
    constructor(primus: any);
    onconnect(callback: (Socket: any) => void): void;
}

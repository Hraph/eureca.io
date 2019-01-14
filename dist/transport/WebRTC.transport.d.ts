/// <reference path="../EObject.class.d.ts" />
/// <reference path="../Util.class.d.ts" />
/// <reference path="../Transport.d.ts" />
/// <reference path="../IServer.interface.d.ts" />
/// <reference path="../ISocket.interface.d.ts" />
/// <reference path="WebRTCPeer.d.ts" />
import { ISocket } from "../ISocket.interface";
import { EObject } from "../EObject.class";
import { IServer } from "../IServer.interface";
import { WebRTCPeer } from "./WebRTCPeer";
export declare class Socket extends EObject implements ISocket {
    socket?: any;
    peer?: WebRTCPeer | undefined;
    request: any;
    id: any;
    remoteAddress: any;
    eureca: any;
    private wRTCPeer;
    constructor(socket?: any, peer?: WebRTCPeer | undefined);
    update(socket?: any): void;
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
    appServer: any;
    private processPost;
    private serverPeer;
    constructor(appServer: any, options: any);
    onconnect(callback: (Socket: any) => void): void;
}

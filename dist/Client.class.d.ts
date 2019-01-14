/// <reference path="transport/Primus.transport.d.ts" />
/// <reference path="transport/WebRTC.transport.d.ts" />
/// <reference path="Stub.d.ts" />
/// <reference path="EObject.class.d.ts" />
/// <reference path="Util.class.d.ts" />
/// <reference path="Contract.class.d.ts" />
import { EObject } from "./EObject.class";
import { ISocket } from "./ISocket.interface";
import { Stub } from "./Stub";
import './transport/Primus.transport';
export declare class Client extends EObject {
    settings: any;
    private _ready;
    private _useWebRTC;
    maxRetries: number;
    tries: number;
    prefix: string;
    uri: string;
    private serialize;
    private deserialize;
    serverProxy: any;
    socket: ISocket;
    contract: string[];
    stub: Stub;
    private transport;
    exports: any;
    constructor(settings?: any);
    disconnect(): void;
    isReady(): boolean;
    send(rawData: any): any;
    authenticate(...args: any[]): void;
    isAuthenticated(): boolean;
    private setupWebRTC;
    connect(): void;
    private _handleClient;
    ready(callback: (any: any) => void): void;
    update(callback: (any: any) => void): void;
    onConnect(callback: (any: any) => void): void;
    onDisconnect(callback: (any: any) => void): void;
    onMessage(callback: (any: any) => void): void;
    onUnhandledMessage(callback: (any: any) => void): void;
    onError(callback: (any: any) => void): void;
    onConnectionLost(callback: (any: any) => void): void;
    onConnectionRetry(callback: (any: any) => void): void;
    onAuthResponse(callback: (any: any) => void): void;
}

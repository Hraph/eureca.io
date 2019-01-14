/// <reference path="transport/Primus.transport.d.ts" />
/// <reference path="transport/WebRTC.transport.d.ts" />
/// <reference path="Transport.d.ts" />
/// <reference path="Stub.d.ts" />
/// <reference path="EObject.class.d.ts" />
/// <reference path="Contract.class.d.ts" />
import { Stub } from "./Stub";
import { EObject } from "./EObject.class";
import './transport/Primus.transport';
export declare class Server extends EObject {
    settings: any;
    contract: any[];
    debuglevel: number;
    allowedF: any;
    clients: any;
    private transport;
    stub: Stub;
    scriptCache: string;
    private serialize;
    private deserialize;
    private useAuthentication;
    ioServer: any;
    exports: any;
    constructor(settings?: any);
    onConnect(callback: (any: any) => void): void;
    onDisconnect(callback: (any: any) => void): void;
    onMessage(callback: (any: any) => void): void;
    onError(callback: (any: any) => void): void;
    getClient(id: any): any;
    updateClientAllowedFunctions(id: any): false | undefined;
    getConnection(id: any): any;
    private sendScript;
    updateContract(): void;
    private static returnFunc;
    private _handleServer;
    attach(appServer: any): void;
}

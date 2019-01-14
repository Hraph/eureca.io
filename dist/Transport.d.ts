/// <reference path="ISocket.interface.d.ts" />
/// <reference path="IServer.interface.d.ts" />
import { IServer } from "./IServer.interface";
import { ISocket } from "./ISocket.interface";
export declare class Transport {
    private static transports;
    static register(name: any, clientScript: string, createClient: (uri: string, options?: any) => ISocket, createServer: (hook: any, options?: any) => IServer, defaultSerializer: (data: any) => any, defaultDeserializer: (data: any) => any): boolean;
    static get(name: any): any;
}

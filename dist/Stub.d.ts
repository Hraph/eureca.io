/// <reference path="Protocol.config.d.ts" />
/// <reference path="Util.class.d.ts" />
/// <reference path="EurecaPromise.d.ts" />
import { EurecaPromise } from "./EurecaPromise";
export declare class Stub {
    settings: any;
    private static callbacks;
    private serialize;
    private deserialize;
    constructor(settings?: any);
    static registerCallBack(sig: any, cb: any): void;
    static doCallBack(sig: any, result: any, error: any): void;
    invokeRemoteOld(context: any, fname: any, socket: any, ...args: any[]): {
        status: number;
        result: null;
        error: null;
        sig: null;
        callback: () => void;
        errorCallback: () => void;
        then: (fn: any, errorFn: any) => void;
    };
    invokeRemote(context: any, fname: any, socket: any, ...args: any[]): EurecaPromise<{}>;
    importRemoteFunction(handle: any, socket: any, functions: any): void;
    private sendResult;
    invoke(context: any, handle: any, obj: any, socket?: any): void;
}

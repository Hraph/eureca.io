/// <reference path="../EObject.class.d.ts" />
/// <reference path="../Util.class.d.ts" />
import { EObject } from "../EObject.class";
export declare class WebRTCPeer extends EObject {
    id: string;
    pc: null;
    private offer;
    channel: null;
    pendingDataChannels: {};
    dataChannels: {};
    cfg: {
        "iceServers": {
            "urls": string;
        }[];
    };
    con: any;
    channelSettings: {
        reliable: boolean;
        ordered: boolean;
        maxRetransmits: null;
    };
    constructor(settings?: any);
    makeOffer(callback: Function, failureCallback: Function): void;
    getAnswer(pastedAnswer: any): void;
    getOffer(pastedOffer: any, request: any, callback: any): void;
    onsignalingstatechange(state: any): void;
    private lastState;
    private stateTimeout;
    oniceconnectionstatechange(state: any): void;
    onicegatheringstatechange(state: any): void;
    doHandleError(error: any): void;
}

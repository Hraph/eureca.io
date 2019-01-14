/// <reference path="ISocket.interface.d.ts" />
export interface IServer {
    onconnect(callback: (ISocket: any) => void): any;
}

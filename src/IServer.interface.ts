/// <reference path="ISocket.interface.ts" />

export interface IServer {
    // Instance member
    onconnect(callback: (ISocket) => void );
}
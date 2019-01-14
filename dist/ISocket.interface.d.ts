export interface ISocket {
    id: any;
    eureca: any;
    send(data: any): any;
    close(): any;
    isAuthenticated(): boolean;
    onopen(callback: (any?: any) => void): any;
    onmessage(callback: (any?: any) => void): any;
    ondisconnect(callback: (any?: any) => void): any;
    onclose(callback: (any?: any) => void): any;
    onerror(callback: (any?: any) => void): any;
}

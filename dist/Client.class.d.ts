/// <reference path="transport/Primus.transport.d.ts" />
/// <reference path="transport/WebRTC.transport.d.ts" />
/// <reference path="Stub.d.ts" />
/// <reference path="EObject.class.d.ts" />
/// <reference path="Util.class.d.ts" />
/// <reference path="Contract.class.d.ts" />
import { EObject } from "./EObject.class";
import { ISocket } from "./ISocket.interface";
import { Stub } from "./Stub";
/**
 * Eureca client class
 * This constructor takes an optional settings object
 * @constructor Client
 * @param {object} [settings] - have the following properties <br />
 * @property {URI} settings.uri - Eureca server WS uri, browser client can automatically guess the server URI if you are using a single Eureca server but Nodejs client need this parameter.
 * @property {string} [settings.prefix=eureca.io] - This determines the websocket path, it's unvisible to the user but if for some reason you want to rename this path use this parameter.
 * @property {int} [settings.retry=20] - Determines max retries to reconnect to the server if the connection is lost.
 * @property {boolean} [settings.autoConnect=true] - Estabilish connection automatically after instantiation.<br />if set to False you'll need to call client.connect() explicitly.
 *
 *
 * @example
 * //<h4>Example of a nodejs client</h4>
 * var Eureca = require('eureca.io');
 * var client = new Eureca.Client({ uri: 'ws://localhost:8000/', prefix: 'eureca.io', retry: 3 });
 * client.ready(function (serverProxy) {
 *    // ...
 * });
 *
 * @example
 * //<h4>Equivalent browser client</h4>
 * &lt;!doctype html&gt;
 * &lt;html&gt;
 *     &lt;head&gt;
 *         &lt;script src=&quot;/eureca.js&quot;&gt;&lt;/script&gt;
 *     &lt;/head&gt;
 *     &lt;body&gt;
 *         &lt;script&gt;
 *             var client = new Eureca.Client({prefix: 'eureca.io', retry: 3 });
 *             //uri is optional in browser client
 *             client.ready(function (serverProxy) {
 *                 // ...
 *             });
 *         &lt;/script&gt;
 *     &lt;/body&gt;
 * &lt;/html&gt;
 *
 * @see authenticate
 * @see connect
 * @see disconnect
 * @see send
 * @see isReady
 *
 *
 */
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
    /**
     * When the connection is estabilished, the server proxy object allow calling exported server functions.
     * @var {object} Client#serverProxy
     *
     */
    serverProxy: any;
    socket: ISocket;
    contract: string[];
    stub: Stub;
    private transport;
    /**
    * All declared functions under this export namespace become available to the server <b>if they are allowed in the server side</b>.
    * @export namespace Client exports
    * @memberOf Client
    *
    * @example
    * var client = new Eureca.Client({..});
    * client.exports.alert = function(message) {
    *       alert(message);
    * }
    */
    exports: any;
    constructor(settings?: any);
    /**
     * close client connection
     *
     *
     * @function Client#disconnect
     *
     */
    disconnect(): void;
    /**
    * indicate if the client is ready or not, it's better to use client.ready() event, but if for some reason
    * you need to check if the client is ready without using the event system you can use this.<br />
    *
     * @function Client#isReady
     * @return {boolean} - true if the client is ready
     *
     * @example
     * var client = new Eureca.Client({..});
     * //...
     * if (client.isReady()) {
     *      client.serverProxy.foo();
     * }
     */
    isReady(): boolean;
    /**
     * Send user data to the server
     *
     * @function Client#send
     * @param {any} rawData - data to send (must be serializable type)
     */
    send(rawData: any): any;
    /**
     * Send authentication request to the server. <br />
     * this can take an arbitrary number of arguments depending on what you defined in the server side <br />
     * when the server receive an auth request it'll handle it and return null on auth success, or an error message if something goes wrong <br />
     * you need to listed to auth result throught authResponse event
     * ** Important ** : it's up to you to define the authenticationmethod in the server side
     * @function Client#authenticate
     *
     * @example
     * var client = new Eureca.Client({..});
     * //listen to auth response
     * client.authResponse(function(result) {
     *     if (result == null) {
     *         // ... Auth OK
     *     }
     *     else {
     *         // ... Auth failed
     *     }
     * });
     *
     * client.ready(function(){
     *
     *      //send auth request
     *      client.authenticate('your_auth_token');
     * });
     */
    authenticate(...args: any[]): void;
    isAuthenticated(): boolean;
    private setupWebRTC;
    /**
     * connect client
     *
     *
     * @function Client#connect
     *
     */
    connect(): void;
    private _handleClient;
    /**
     * Bind a callback to 'ready' event @see {@link Client#event:ready|Client ready event}
     * >**Note :** you can also use Client.on('ready', callback) to bind ready event
     *
     * @function Client#ready
     *
     */
    ready(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'update' event @see {@link Client#event:update|Client update event}
     * >**Note :** you can also use Client.on('update', callback) to bind update event
     *
     * @function Client#update
     *
     */
    update(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'connect' event
     * >**Note :** you can also use Client.on('connect', callback) to bind connect event
     *
     * @function Client#onConnect
     *
     */
    onConnect(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'disconnect' event @see {@link Client#event:disconnect|Client disconnect event}
     * >**Note :** you can also use Client.on('disconnect', callback) to bind disconnect event
     *
     * @function Client#donDisconnect
     *
     */
    onDisconnect(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'message' event @see {@link Client#event:message|Client message event}
     * >**Note :** you can also use Client.on('message', callback) to bind message event
     *
     * @function Client#onMessage
     *
     */
    onMessage(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'unhandledMessage' event @see {@link Client#event:unhandledMessage|Client unhandledMessage event}
     * >**Note :** you can also use Client.on('message', callback) to bind unhandledMessage event
     *
     * @function Client#onUnhandledMessage
     *
     */
    onUnhandledMessage(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'error' event @see {@link Client#event:error|Client error event}
     * >**Note :** you can also use Client.on('error', callback) to bind error event
     *
     * @function Client#onError
     *
     */
    onError(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'connectionLost' event
     * >**Note :** you can also use Client.on('connectionLost', callback) to bind connectionLost event
     *
     * @function Client#onConnectionLost
     *
     */
    onConnectionLost(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'connectionRetry' event
     * >**Note :** you can also use Client.on('connectionRetry', callback) to bind connectionRetry event
     *
     * @function Client#onConnectionRetry
     *
     */
    onConnectionRetry(callback: (any: any) => void): void;
    /**
     * Bind a callback to 'authResponse' event @see {@link Client#event:authResponse|Client authResponse event}
     * >**Note :** you can also use Client.on('authResponse', callback) to bind authResponse event
     *
     * @function Client#onAuthResponse
     *
     */
    onAuthResponse(callback: (any: any) => void): void;
}

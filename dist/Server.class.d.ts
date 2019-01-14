/// <reference path="transport/Primus.transport.d.ts" />
/// <reference path="transport/WebRTC.transport.d.ts" />
/// <reference path="Transport.d.ts" />
/// <reference path="Stub.d.ts" />
/// <reference path="EObject.class.d.ts" />
/// <reference path="Contract.class.d.ts" />
/** @ignore */
import { Stub } from "./Stub";
import { EObject } from "./EObject.class";
/**
 * Eureca server constructor
 * This constructor takes an optional settings object
 * @constructor Server
 * @param {object} [settings] - have the following properties
 * @property {string} [settings.transport=engine.io] - can be "engine.io", "sockjs", "websockets", "faye" or "browserchannel" by default "engine.io" is used
 * @property {function} [settings.authenticate] - If this function is defined, the client will not be able to invoke server functions until it successfully call the client side authenticate method, which will invoke this function.
 * @property {function} [settings.serialize] - If defined, this function is used to serialize the request object before sending it to the client (default is JSON.stringify). This function can be useful to add custom information/meta-data to the transmitted request.
 * @property {function} [settings.deserialize] - If defined, this function is used to deserialize the received response string.

 * @example
 * <h4> # default instantiation</h4>
 * var Eureca = require('eureca.io');
 * //use default transport
 * var server = new Eureca.Server();
 *
 *
 * @example
 * <h4> # custom transport instantiation </h4>
 * var Eureca = require('eureca.io');
 * //use websockets transport
 * var server = new Eureca.Server({transport:'websockets'});
 *
 * @example
 * <h4> # Authentication </h4>
 * var Eureca = require('eureca.io');
 *
 * var eurecaServer = new Eureca.Server({
 *     authenticate: function (authToken, next) {
 *         console.log('Called Auth with token=', authToken);
 *
 *         if (isValidToekn(authToken)) next();  // authentication success
 *         else next('Auth failed'); //authentication fail
 *     }
 * });
 *
 * @see attach
 * @see getClient
 *
 *
 */
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
    /**
    * All declared functions under this export namespace become available to the clients.
    * @export namespace Server exports
    * @memberOf Server
    *
    * @example
    * var Eureca = require('eureca.io');
    * //use default transport
    * var server = new Eureca.Server();
    * server.exports.add = function(a, b) {
    *      return a + b;
    * }
    */
    exports: any;
    constructor(settings?: any);
    onConnect(callback: (any: any) => void): void;
    onDisconnect(callback: (any: any) => void): void;
    onMessage(callback: (any: any) => void): void;
    onError(callback: (any: any) => void): void;
    /**
     * This method is used to get the client proxy of a given connection.
     * it allows the server to call remote client function
     *
     * @function Server#getClient
     * @param {String} id - client identifier
     * @returns {Proxy}
     *
    * @example
    * //we suppose here that the clients are exposing hello() function
    * //onConnect event give the server an access to the client socket
    * server.onConnect(function (socket) {
    *      //get client proxy by socket ID
    *      var client = server.getClient(socket.id);
    *      //call remote hello() function.
    *      client.hello();
    * }
     */
    getClient(id: any): any;
    /**
     * **!! Experimental !! **<br />
     * force regeneration of client remote function signatures
     * this is needed if for some reason we need to dynamically update allowed client functions at runtime
     * @function Server#updateClientAllowedFunctions
     * @param {String} id - client identifier
     */
    updateClientAllowedFunctions(id: any): false | undefined;
    getConnection(id: any): any;
    private sendScript;
    /**
     * **!! Experimental !! **<br />
     * Sends exported server functions to all connected clients <br />
     * This can be used if the server is designed to dynamically expose new methods.
     *
     * @function Server#updateContract
     */
    updateContract(): void;
    private static returnFunc;
    private _handleServer;
    /**
     * Sends exported server functions to all connected clients <br />
     * This can be used if the server is designed to dynamically expose new methods.
     *
     * @function attach
     * @memberof Server#
     * @param {appServer} - a nodejs {@link https://nodejs.org/api/http.html#http_class_http_server|nodejs http server}
     *  or {@link http://expressjs.com/api.html#application|expressjs Application}
     *
     */
    attach(appServer: any): void;
}

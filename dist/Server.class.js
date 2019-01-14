"use strict";
/// <reference path="transport/Primus.transport.ts" />
/// <reference path="transport/WebRTC.transport.ts" />
/// <reference path="Transport.ts" />
/// <reference path="Stub.ts" />
/// <reference path="EObject.class.ts" />
/// <reference path="Contract.class.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
/** @ignore */
//declare var require: any;
const Stub_1 = require("./Stub");
const Transport_1 = require("./Transport");
const Contract_class_1 = require("./Contract.class");
const Protocol_config_1 = require("./Protocol.config");
const EObject_class_1 = require("./EObject.class");
/** @ignore */
//declare var Proxy: any;
var fs = require('fs');
//var EProxy = require('./EurecaProxy.class.js').Eureca.EurecaProxy;
//var io = require('engine.io');
var util = require('util');
var http = require('http');
var host = '';
function getUrl(req) {
    var scheme = req.headers.referer !== undefined ? req.headers.referer.split(':')[0] : 'http';
    host = scheme + '://' + req.headers.host;
    return host;
}
var hproxywarn = false;
var clientUrl = {};
var ELog = console;
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
class Server extends EObject_class_1.EObject {
    constructor(settings = {}) {
        super();
        this.settings = settings;
        this.scriptCache = '';
        this.serialize = (v) => v;
        this.deserialize = (v) => v;
        //needed by primus
        settings.transformer = settings.transport || 'engine.io';
        this.transport = Transport_1.Transport.get(settings.transformer);
        if (typeof settings.serialize == 'function' || typeof this.transport.serialize == 'function')
            this.serialize = settings.serialize || this.transport.serialize;
        settings.serialize = this.serialize;
        if (typeof settings.deserialize == 'function' || typeof this.transport.deserialize == 'function')
            this.deserialize = settings.deserialize || this.transport.deserialize;
        settings.deserialize = this.deserialize;
        this.stub = new Stub_1.Stub(settings);
        this.contract = [];
        this.debuglevel = settings.debuglevel || 1;
        //Removing need for Harmony proxies for simplification
        //var _exports = {};
        //this.exports = Contract.proxify(_exports, this.contract);
        this.exports = {};
        this.allowedF = [];
        this.clients = {};
        this.useAuthentication = (typeof this.settings.authenticate == 'function');
        if (this.useAuthentication)
            this.exports.authenticate = this.settings.authenticate;
        //this.registerEvents(['onConnect', 'onDisconnect', 'onMessage', 'onError']);
    }
    onConnect(callback) {
        this.on('connect', callback);
    }
    onDisconnect(callback) {
        this.on('disconnect', callback);
    }
    onMessage(callback) {
        this.on('message', callback);
    }
    onError(callback) {
        this.on('error', callback);
    }
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
    getClient(id) {
        var conn = this.clients[id];
        if (conn === undefined)
            return false;
        if (conn.clientProxy !== undefined)
            return conn.clientProxy;
        conn.clientProxy = {};
        conn._proxy = conn.clientProxy;
        //this.importClientFunction(conn.client, conn, this.allowedF);
        this.stub.importRemoteFunction(conn.clientProxy, conn, conn.contract || this.allowedF /*, this.serialize*/);
        return conn.clientProxy;
    }
    /**
     * **!! Experimental !! **<br />
     * force regeneration of client remote function signatures
     * this is needed if for some reason we need to dynamically update allowed client functions at runtime
     * @function Server#updateClientAllowedFunctions
     * @param {String} id - client identifier
     */
    updateClientAllowedFunctions(id) {
        var conn = this.clients[id];
        if (conn === undefined)
            return false;
        conn.clientProxy = {};
        conn._proxy = conn.clientProxy;
        //this.importClientFunction(conn.client, conn, this.allowedF);
        this.stub.importRemoteFunction(conn.clientProxy, conn, this.allowedF /*, this.serialize*/);
    }
    getConnection(id) {
        return this.clients[id];
    }
    sendScript(request, response, prefix) {
        if (this.scriptCache != '') {
            response.writeHead(200);
            response.write(this.scriptCache);
            response.end();
            return;
        }
        this.scriptCache = '';
        if (this.transport.script) {
            if (this.transport.script.length < 256 && fs.existsSync(__dirname + this.transport.script))
                this.scriptCache += fs.readFileSync(__dirname + this.transport.script);
            else
                this.scriptCache += this.transport.script;
        }
        this.scriptCache += '\nvar _eureca_prefix = "' + prefix + '";\n';
        this.scriptCache += '\nvar _eureca_uri = "' + getUrl(request) + '";\n';
        this.scriptCache += '\nvar _eureca_host = "' + getUrl(request) + '";\n';
        //FIXME : override primus hardcoded pathname
        this.scriptCache += '\nif (typeof Primus != "undefined") Primus.prototype.pathname = "/' + prefix + '";\n';
        this.scriptCache += fs.readFileSync(__dirname + '/EurecaClient.js');
        response.writeHead(200);
        response.write(this.scriptCache);
        response.end();
    }
    /**
     * **!! Experimental !! **<br />
     * Sends exported server functions to all connected clients <br />
     * This can be used if the server is designed to dynamically expose new methods.
     *
     * @function Server#updateContract
     */
    updateContract() {
        this.contract = Contract_class_1.Contract.ensureContract(this.exports, this.contract);
        for (var id in this.clients) {
            var socket = this.clients[id];
            var sendObj = {};
            sendObj[Protocol_config_1.Protocol.contractId] = this.contract;
            socket.send(this.serialize(sendObj));
        }
    }
    //this function is internally used to return value for asynchronous calls in the server side
    static returnFunc(result, error = null) {
        var retObj = {};
        retObj[Protocol_config_1.Protocol.signatureId] = this['retId'];
        retObj[Protocol_config_1.Protocol.resultId] = result;
        retObj[Protocol_config_1.Protocol.errorId] = error;
        this['connection'].send(this['serialize'](retObj));
    }
    _handleServer(ioServer) {
        var __this = this;
        //ioServer.on('connection', function (socket) {
        ioServer.onconnect(function (eurecaClientSocket) {
            //socket.siggg = 'A';
            eurecaClientSocket.eureca.remoteAddress = eurecaClientSocket.remoteAddress;
            __this.clients[eurecaClientSocket.id] = eurecaClientSocket;
            //Send EURECA contract
            var sendContract = function () {
                __this.contract = Contract_class_1.Contract.ensureContract(__this.exports, __this.contract);
                var sendObj = {};
                sendObj[Protocol_config_1.Protocol.contractId] = __this.contract;
                if (__this.allowedF == 'all')
                    sendObj[Protocol_config_1.Protocol.signatureId] = eurecaClientSocket.id;
                eurecaClientSocket.send(__this.serialize(sendObj));
            };
            if (!__this.useAuthentication)
                sendContract();
            //attach socket client
            eurecaClientSocket.clientProxy = __this.getClient(eurecaClientSocket.id);
            eurecaClientSocket._proxy = eurecaClientSocket.clientProxy;
            /**
            * Triggered each time a new client is connected
            *
            * @event Server#connect
            * @property {ISocket} socket - client socket.
            */
            __this.trigger('connect', eurecaClientSocket);
            eurecaClientSocket.on('message', function (message) {
                /**
                * Triggered each time a new message is received from a client.
                *
                * @event Server#message
                * @property {String} message - the received message.
                * @property {ISocket} socket - client socket.
                */
                __this.trigger('message', message, eurecaClientSocket);
                var context;
                var jobj = __this.deserialize.call(eurecaClientSocket, message);
                if (jobj === undefined) {
                    __this.trigger('unhandledMessage', message, eurecaClientSocket);
                    return;
                }
                //Handle authentication
                if (jobj[Protocol_config_1.Protocol.authReq] !== undefined) {
                    if (typeof __this.settings.authenticate == 'function') {
                        var args = jobj[Protocol_config_1.Protocol.authReq];
                        args.push(function (error) {
                            if (error == null) {
                                eurecaClientSocket.eureca.authenticated = true;
                                sendContract();
                            }
                            var authResponse = {};
                            authResponse[Protocol_config_1.Protocol.authResp] = [error];
                            eurecaClientSocket.send(__this.serialize(authResponse));
                            __this.trigger('authentication', error);
                        });
                        var context = {
                            user: { clientId: eurecaClientSocket.id },
                            connection: eurecaClientSocket,
                            socket: eurecaClientSocket,
                            request: eurecaClientSocket.request
                        };
                        __this.settings.authenticate.apply(context, args);
                    }
                    return;
                }
                if (__this.useAuthentication && !eurecaClientSocket.eureca.authenticated) {
                    //console.log('Authentication needed for ', eurecaClientSocket.id);
                    return;
                }
                /** Experimental : dynamic client contract*/
                //if (jobj[Protocol.contractId] !== undefined) {
                //    socket.contract = jobj[Protocol.contractId];
                //    return;
                //}
                /*****************************************/
                //handle remote call
                if (jobj[Protocol_config_1.Protocol.functionId] !== undefined) {
                    var context = {
                        user: { clientId: eurecaClientSocket.id },
                        connection: eurecaClientSocket,
                        socket: eurecaClientSocket,
                        serialize: __this.serialize,
                        clientProxy: eurecaClientSocket.clientProxy,
                        async: false,
                        retId: jobj[Protocol_config_1.Protocol.signatureId],
                        return: Server.returnFunc
                    };
                    __this.stub.invoke(context, __this, jobj, eurecaClientSocket);
                    return;
                }
                //handle remote response
                if (jobj[Protocol_config_1.Protocol.signatureId] !== undefined) //invoke result
                 {
                    //_this.stub.doCallBack(jobj[Protocol.signatureId], jobj[Protocol.resultId], jobj[Protocol.errorId]);
                    Stub_1.Stub.doCallBack(jobj[Protocol_config_1.Protocol.signatureId], jobj[Protocol_config_1.Protocol.resultId], jobj[Protocol_config_1.Protocol.errorId]);
                    return;
                }
                __this.trigger('unhandledMessage', message, eurecaClientSocket);
            });
            eurecaClientSocket.on('error', function (e) {
                /**
                * triggered if an error occure.
                *
                * @event Server#error
                * @property {String} error - the error message
                * @property {ISocket} socket - client socket.
                */
                __this.trigger('error', e, eurecaClientSocket);
            });
            eurecaClientSocket.on('close', function () {
                /**
                * triggered when the client is disconneced.
                *
                * @event Server#disconnect
                * @property {ISocket} socket - client socket.
                */
                __this.trigger('disconnect', eurecaClientSocket);
                delete __this.clients[eurecaClientSocket.id];
            });
            eurecaClientSocket.on('stateChange', function (s) {
                __this.trigger('stateChange', s);
            });
        });
    }
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
    attach(appServer) {
        var __this = this;
        var app = undefined;
        //is it express application ?
        if (appServer._events && appServer._events.request !== undefined && appServer.routes === undefined && appServer._events.request.on)
            app = appServer._events.request;
        //is standard http server ?
        if (app === undefined && appServer instanceof http.Server)
            app = appServer;
        //not standard http server nor express app ==> try to guess http.Server instance
        if (app === undefined) {
            var keys = Object.getOwnPropertyNames(appServer);
            for (let k of keys) {
                if (appServer[k] instanceof http.Server) {
                    //got it !
                    app = appServer[k];
                    break;
                }
            }
        }
        //this._checkHarmonyProxies();
        appServer.eurecaServer = this;
        this.allowedF = this.settings.allow || [];
        var _prefix = this.settings.prefix || 'eureca.io';
        var _clientUrl = this.settings.clientScript || '/eureca.js';
        var _transformer = this.settings.transformer;
        var _parser = this.settings.parser;
        //initialising server
        //var ioServer = io.attach(server, { path: '/'+_prefix });
        this.ioServer = this.transport.createServer(appServer, { prefix: _prefix, transformer: _transformer, parser: _parser });
        //console.log('Primus ? ', ioServer.primus);
        //var scriptLib = (typeof ioServer.primus == 'function') ? ioServer.primus.library() : null;
        this._handleServer(this.ioServer);
        //install on express
        //sockjs_server.installHandlers(server, {prefix:_prefix});
        if (app.get && app.post) //TODO : better way to detect express
         {
            app.get(_clientUrl, function (request, response) {
                __this.sendScript(request, response, _prefix);
            });
        }
        else //Fallback to nodejs
         {
            app.on('request', function (request, response) {
                if (request.method === 'GET') {
                    if (request.url.split('?')[0] === _clientUrl) {
                        __this.sendScript(request, response, _prefix);
                    }
                }
            });
        }
        //console.log('>>>>>>>>>>>> ', app.get);
        //Workaround : nodejs 0.10.0 have a strange behaviour making remoteAddress unavailable when connecting from a nodejs client
        appServer.on('request', function (request, response) {
            if (!request.query)
                return;
            var id = request.query.sid;
            var client = __this.clients[request.query.sid];
            if (client) {
                client.eureca = client.eureca || {};
                client.eureca.remoteAddress = client.eureca.remoteAddress || request.socket.remoteAddress;
                client.eureca.remotePort = client.eureca.remotePort || request.socket.remotePort;
            }
            //req.eureca = {
            //    remoteAddress: req.socket.remoteAddress,
            //    remotePort: req.socket.remotePort
            //}
        });
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.class.js.map
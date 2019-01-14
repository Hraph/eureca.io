"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Stub_1 = require("./Stub");
const Transport_1 = require("./Transport");
const Contract_class_1 = require("./Contract.class");
const Protocol_config_1 = require("./Protocol.config");
const EObject_class_1 = require("./EObject.class");
require("./transport/Primus.transport");
var fs = require('fs');
var http = require('http');
var host = '';
function getUrl(req) {
    var scheme = req.headers.referer !== undefined ? req.headers.referer.split(':')[0] : 'http';
    host = scheme + '://' + req.headers.host;
    return host;
}
class Server extends EObject_class_1.EObject {
    constructor(settings = {}) {
        super();
        this.settings = settings;
        this.scriptCache = '';
        this.serialize = (v) => v;
        this.deserialize = (v) => v;
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
        this.exports = {};
        this.allowedF = [];
        this.clients = {};
        this.useAuthentication = (typeof this.settings.authenticate == 'function');
        if (this.useAuthentication)
            this.exports.authenticate = this.settings.authenticate;
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
    getClient(id) {
        var conn = this.clients[id];
        if (conn === undefined)
            return false;
        if (conn.clientProxy !== undefined)
            return conn.clientProxy;
        conn.clientProxy = {};
        conn._proxy = conn.clientProxy;
        this.stub.importRemoteFunction(conn.clientProxy, conn, conn.contract || this.allowedF);
        return conn.clientProxy;
    }
    updateClientAllowedFunctions(id) {
        var conn = this.clients[id];
        if (conn === undefined)
            return false;
        conn.clientProxy = {};
        conn._proxy = conn.clientProxy;
        this.stub.importRemoteFunction(conn.clientProxy, conn, this.allowedF);
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
        this.scriptCache += '\nif (typeof Primus != "undefined") Primus.prototype.pathname = "/' + prefix + '";\n';
        this.scriptCache += fs.readFileSync(__dirname + '/EurecaClient.js');
        response.writeHead(200);
        response.write(this.scriptCache);
        response.end();
    }
    updateContract() {
        this.contract = Contract_class_1.Contract.ensureContract(this.exports, this.contract);
        for (var id in this.clients) {
            var socket = this.clients[id];
            var sendObj = {};
            sendObj[Protocol_config_1.Protocol.contractId] = this.contract;
            socket.send(this.serialize(sendObj));
        }
    }
    static returnFunc(result, error = null) {
        var retObj = {};
        retObj[Protocol_config_1.Protocol.signatureId] = this['retId'];
        retObj[Protocol_config_1.Protocol.resultId] = result;
        retObj[Protocol_config_1.Protocol.errorId] = error;
        this['connection'].send(this['serialize'](retObj));
    }
    _handleServer(ioServer) {
        var __this = this;
        ioServer.onconnect(function (eurecaClientSocket) {
            eurecaClientSocket.eureca.remoteAddress = eurecaClientSocket.remoteAddress;
            __this.clients[eurecaClientSocket.id] = eurecaClientSocket;
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
            eurecaClientSocket.clientProxy = __this.getClient(eurecaClientSocket.id);
            eurecaClientSocket._proxy = eurecaClientSocket.clientProxy;
            __this.trigger('connect', eurecaClientSocket);
            eurecaClientSocket.on('message', function (message) {
                __this.trigger('message', message, eurecaClientSocket);
                var context;
                var jobj = __this.deserialize.call(eurecaClientSocket, message);
                if (jobj === undefined) {
                    __this.trigger('unhandledMessage', message, eurecaClientSocket);
                    return;
                }
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
                    return;
                }
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
                if (jobj[Protocol_config_1.Protocol.signatureId] !== undefined) {
                    Stub_1.Stub.doCallBack(jobj[Protocol_config_1.Protocol.signatureId], jobj[Protocol_config_1.Protocol.resultId], jobj[Protocol_config_1.Protocol.errorId]);
                    return;
                }
                __this.trigger('unhandledMessage', message, eurecaClientSocket);
            });
            eurecaClientSocket.on('error', function (e) {
                __this.trigger('error', e, eurecaClientSocket);
            });
            eurecaClientSocket.on('close', function () {
                __this.trigger('disconnect', eurecaClientSocket);
                delete __this.clients[eurecaClientSocket.id];
            });
            eurecaClientSocket.on('stateChange', function (s) {
                __this.trigger('stateChange', s);
            });
        });
    }
    attach(appServer) {
        var __this = this;
        var app = undefined;
        if (appServer._events && appServer._events.request !== undefined && appServer.routes === undefined && appServer._events.request.on)
            app = appServer._events.request;
        if (app === undefined && appServer instanceof http.Server)
            app = appServer;
        if (app === undefined) {
            var keys = Object.getOwnPropertyNames(appServer);
            for (let k of keys) {
                if (appServer[k] instanceof http.Server) {
                    app = appServer[k];
                    break;
                }
            }
        }
        appServer.eurecaServer = this;
        this.allowedF = this.settings.allow || [];
        var _prefix = this.settings.prefix || 'eureca.io';
        var _clientUrl = this.settings.clientScript || '/eureca.js';
        var _transformer = this.settings.transformer;
        var _parser = this.settings.parser;
        this.ioServer = this.transport.createServer(appServer, { prefix: _prefix, transformer: _transformer, parser: _parser });
        this._handleServer(this.ioServer);
        if (app.get && app.post) {
            app.get(_clientUrl, function (request, response) {
                __this.sendScript(request, response, _prefix);
            });
        }
        else {
            app.on('request', function (request, response) {
                if (request.method === 'GET') {
                    if (request.url.split('?')[0] === _clientUrl) {
                        __this.sendScript(request, response, _prefix);
                    }
                }
            });
        }
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
        });
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.class.js.map
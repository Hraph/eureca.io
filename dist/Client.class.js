"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EObject_class_1 = require("./EObject.class");
const Stub_1 = require("./Stub");
const Protocol_config_1 = require("./Protocol.config");
const Util_class_1 = require("./Util.class");
const Transport_1 = require("./Transport");
require("./transport/Primus.transport");
var is_nodejs = Util_class_1.Util.isNodejs;
if (is_nodejs) {
    var _eureca_prefix = 'eureca.io';
}
class Client extends EObject_class_1.EObject {
    constructor(settings = {}) {
        super();
        this.settings = settings;
        this.tries = 0;
        this.serialize = (v) => v;
        this.deserialize = (v) => v;
        this.serverProxy = {};
        settings.transformer = settings.transport || 'engine.io';
        this.transport = Transport_1.Transport.get(settings.transformer);
        if (typeof settings.serialize == 'function' || typeof this.transport.serialize == 'function')
            this.serialize = settings.serialize || this.transport.serialize;
        settings.serialize = this.serialize;
        if (typeof settings.deserialize == 'function' || typeof this.transport.deserialize == 'function')
            this.deserialize = settings.deserialize || this.transport.deserialize;
        settings.deserialize = this.deserialize;
        this.stub = new Stub_1.Stub(settings);
        this.exports = {};
        this.settings.autoConnect = !(this.settings.autoConnect === false);
        this.maxRetries = settings.retry || 20;
        if (this.settings.autoConnect)
            this.connect();
    }
    disconnect() {
        this.tries = this.maxRetries + 1;
        this.socket.close();
    }
    isReady() {
        return this._ready;
    }
    send(rawData) {
        return this.socket.send(this.serialize(rawData));
    }
    authenticate(...args) {
        var authRequest = {};
        authRequest[Protocol_config_1.Protocol.authReq] = args;
        this.socket.send(this.serialize(authRequest));
    }
    isAuthenticated() {
        return this.socket.isAuthenticated();
    }
    setupWebRTC() {
    }
    connect() {
        var prefix = '';
        prefix += this.settings.prefix || _eureca_prefix;
        var _eureca_uri = _eureca_uri || undefined;
        var uri = this.settings.uri || (prefix ? _eureca_host + '/' + prefix : (_eureca_uri || undefined));
        this._ready = false;
        var _transformer = this.settings.transformer;
        var _parser = this.settings.parser;
        var client = this.transport.createClient(uri, {
            prefix: prefix,
            transformer: _transformer,
            parser: _parser,
            retries: this.maxRetries,
            minDelay: 100,
            reliable: this.settings.reliable,
            maxRetransmits: this.settings.maxRetransmits,
            ordered: this.settings.ordered
        });
        this.socket = client;
        client._proxy = this.serverProxy;
        this._handleClient(client, this.serverProxy);
    }
    _handleClient(client, proxy) {
        const __this = this;
        client.on('open', function () {
            __this.trigger('connect', client);
            __this.tries = 0;
        });
        client.on('message', function (data) {
            __this.trigger('message', data);
            var jobj = __this.deserialize.call(client, data);
            if (typeof jobj != 'object') {
                __this.trigger('unhandledMessage', data);
                return;
            }
            if (jobj[Protocol_config_1.Protocol.contractId]) {
                var update = __this.contract && __this.contract.length > 0;
                __this.contract = jobj[Protocol_config_1.Protocol.contractId];
                __this.stub.importRemoteFunction(proxy, client, jobj[Protocol_config_1.Protocol.contractId]);
                __this._ready = true;
                if (update) {
                    __this.trigger('update', proxy, __this.contract);
                }
                else {
                    __this.trigger('ready', proxy, __this.contract);
                }
                return;
            }
            if (jobj[Protocol_config_1.Protocol.authResp] !== undefined) {
                client.eureca.authenticated = true;
                var callArgs = ['authResponse'].concat(jobj[Protocol_config_1.Protocol.authResp]);
                __this.trigger.apply(__this, callArgs);
                return;
            }
            if (jobj[Protocol_config_1.Protocol.functionId] !== undefined) {
                if (client.context == undefined) {
                    var returnFunc = function (result, error = null) {
                        var retObj = {};
                        retObj[Protocol_config_1.Protocol.signatureId] = this.retId;
                        retObj[Protocol_config_1.Protocol.resultId] = result;
                        retObj[Protocol_config_1.Protocol.errorId] = error;
                        this.connection.send(this.serialize(retObj));
                    };
                    client.context = {
                        user: { clientId: client.id },
                        connection: client,
                        socket: client,
                        serverProxy: client.serverProxy,
                        async: false,
                        retId: jobj[Protocol_config_1.Protocol.signatureId],
                        serialize: __this.serialize,
                        'return': returnFunc
                    };
                }
                client.context.retId = jobj[Protocol_config_1.Protocol.signatureId];
                __this.stub.invoke(client.context, __this, jobj, client);
                return;
            }
            if (jobj[Protocol_config_1.Protocol.signatureId] !== undefined) {
                Stub_1.Stub.doCallBack(jobj[Protocol_config_1.Protocol.signatureId], jobj[Protocol_config_1.Protocol.resultId], jobj[Protocol_config_1.Protocol.errorId]);
                return;
            }
            __this.trigger('unhandledMessage', data);
        });
        client.on('reconnecting', function (opts) {
            __this.trigger('connectionRetry', opts);
        });
        client.on('close', function (e) {
            __this.trigger('disconnect', client, e);
            __this.trigger('connectionLost');
        });
        client.on('error', function (e) {
            __this.trigger('error', e);
        });
        client.on('stateChange', function (s) {
            __this.trigger('stateChange', s);
        });
    }
    ready(callback) {
        this.on('ready', callback);
    }
    update(callback) {
        this.on('update', callback);
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
    onUnhandledMessage(callback) {
        this.on('unhandledMessage', callback);
    }
    onError(callback) {
        this.on('error', callback);
    }
    onConnectionLost(callback) {
        this.on('connectionLost', callback);
    }
    onConnectionRetry(callback) {
        this.on('connectionRetry', callback);
    }
    onAuthResponse(callback) {
        this.on('authResponse', callback);
    }
}
exports.Client = Client;
//# sourceMappingURL=Client.class.js.map
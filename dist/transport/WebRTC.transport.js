"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_class_1 = require("../Util.class");
const EObject_class_1 = require("../EObject.class");
const Protocol_config_1 = require("../Protocol.config");
const Transport_1 = require("../Transport");
var qs, http;
if (Util_class_1.Util.isNodejs) {
    qs = require('querystring');
    http = require('http');
    try {
        webrtc = require('wrtc');
    }
    catch (e) {
        webrtc = {};
    }
}
class Socket extends EObject_class_1.EObject {
    constructor(socket, peer) {
        super();
        this.socket = socket;
        this.peer = peer;
        this.eureca = {};
        this.id = peer && peer.id ? peer.id : Util_class_1.Util.randomStr(16);
        if (socket && socket.request)
            this.request = socket.request;
        this.bindEvents();
    }
    update(socket) {
        if (this.socket != null) {
            this.socket.onopen = null;
            this.socket.onmessage = null;
            this.socket.onclose = null;
            this.socket.onerror = null;
        }
        this.socket = socket;
        this.bindEvents();
    }
    bindEvents() {
        if (this.socket == null)
            return;
        var __this = this;
        this.socket.onopen = function () {
            __this.trigger('open');
        };
        this.socket.onmessage = function (event) {
            __this.trigger('message', event.data);
        };
        this.socket.onclose = function () {
            __this.trigger('close');
        };
        this.socket.onerror = function (error) {
            __this.trigger('error', error);
        };
        if (this.peer) {
            this.peer.on('stateChange', function (s) {
                __this.trigger('stateChange', s);
            });
        }
    }
    isAuthenticated() {
        return this.eureca.authenticated;
    }
    send(data) {
        if (this.socket == null)
            return;
        this.socket.send(data);
    }
    close() {
        this.socket.close();
    }
    onopen(callback) {
        this.on('open', callback);
    }
    onmessage(callback) {
        this.on('message', callback);
    }
    onclose(callback) {
        this.on('close', callback);
    }
    onerror(callback) {
        this.on('error', callback);
    }
    ondisconnect(callback) {
    }
}
exports.Socket = Socket;
class Server {
    constructor(appServer, options) {
        this.appServer = appServer;
        this.serverPeer = new WebRTC.Peer();
        var __this = this;
        var app = appServer;
        if (appServer._events.request !== undefined && appServer.routes === undefined)
            app = appServer._events.request;
        if (app.get && app.post) {
            app.post('/webrtc-' + options.prefix, function (request, response) {
                if (request.body) {
                    var offer = request.body[Protocol_config_1.Protocol.signal];
                    __this.serverPeer.getOffer(offer, request, function (pc) {
                        var resp = {};
                        resp[Protocol_config_1.Protocol.signal] = pc.localDescription;
                        response.write(JSON.stringify(resp));
                        response.end();
                    });
                    return;
                }
                __this.processPost(request, response, function () {
                    var offer = request.post[Protocol_config_1.Protocol.signal];
                    response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });
                    __this.serverPeer.getOffer(offer, request, function (pc) {
                        var resp = {};
                        resp[Protocol_config_1.Protocol.signal] = pc.localDescription;
                        response.write(JSON.stringify(resp));
                        response.end();
                    });
                });
            });
        }
        else {
            appServer.on('request', function (request, response) {
                if (request.method === 'POST') {
                    if (request.url.split('?')[0] === '/webrtc-' + options.prefix) {
                        __this.processPost(request, response, function () {
                            var offer = request.post[Protocol_config_1.Protocol.signal];
                            response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });
                            __this.serverPeer.getOffer(offer, request, function (pc) {
                                var resp = {};
                                resp[Protocol_config_1.Protocol.signal] = pc.localDescription;
                                response.write(JSON.stringify(resp));
                                response.end();
                            });
                        });
                    }
                }
            });
        }
        __this.serverPeer.on('stateChange', function (s) {
            __this.appServer.eurecaServer.trigger('stateChange', s);
        });
    }
    processPost(request, response, callback) {
        var queryData = "";
        if (typeof callback !== 'function')
            return null;
        if (request.method == 'POST') {
            request.on('data', function (data) {
                queryData += data;
                if (queryData.length > 1e6) {
                    queryData = "";
                    response.writeHead(413, { 'Content-Type': 'text/plain' }).end();
                    request.connection.destroy();
                }
            });
            request.on('end', function () {
                request.post = qs.parse(queryData);
                callback();
            });
        }
        else {
            response.writeHead(405, { 'Content-Type': 'text/plain' });
            response.end();
        }
    }
    onconnect(callback) {
        this.serverPeer.on('datachannel', function (datachannel) {
            var socket = new Socket(datachannel);
            callback(socket);
        });
    }
}
exports.Server = Server;
var createServer = function (hook, options) {
    try {
        var server = new Server(hook, options);
        return server;
    }
    catch (ex) {
    }
};
var createClient = function (uri, options = {}) {
    options.pathname = options.prefix ? '/' + options.prefix : undefined;
    options.path = options.prefix ? '/' + options.prefix : undefined;
    var clientPeer;
    clientPeer = new WebRTC.Peer(options);
    clientPeer.on('disconnected', function () {
        clientPeer.channel.close();
        signal();
    });
    var client = new Socket(clientPeer.channel, clientPeer);
    var retries = options.retries;
    var signal = function () {
        if (retries <= 0) {
            client.trigger('close');
            return;
        }
        retries--;
        clientPeer.makeOffer(function (pc) {
            if (Util_class_1.Util.isNodejs) {
                var url = require("url");
                var postDataObj = {};
                postDataObj[Protocol_config_1.Protocol.signal] = JSON.stringify(pc.localDescription);
                var post_data = qs.stringify(postDataObj);
                var parsedURI = url.parse(uri);
                var post_options = {
                    host: parsedURI.hostname,
                    port: parsedURI.port,
                    path: '/webrtc-' + options.prefix,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': post_data.length
                    }
                };
                var post_req = http.request(post_options, function (res) {
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        var resp = JSON.parse(chunk);
                        clientPeer.getAnswer(resp[Protocol_config_1.Protocol.signal]);
                        retries = options.retries;
                    });
                });
                post_req.write(post_data);
                post_req.end();
                post_req.on('error', function (error) {
                    setTimeout(function () { signal(); }, 3000);
                });
            }
            else {
                var xhr = new XMLHttpRequest();
                var params = Protocol_config_1.Protocol.signal + '=' + JSON.stringify(pc.localDescription);
                var parser = document.createElement('a');
                parser.href = uri;
                xhr.open("POST", '//' + parser.hostname + ':' + parser.port + '/webrtc-' + options.prefix, true);
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        var resp = JSON.parse(xhr.responseText);
                        clientPeer.getAnswer(resp[Protocol_config_1.Protocol.signal]);
                        retries = options.retries;
                    }
                    else {
                        if (xhr.readyState == 4 && xhr.status != 200) {
                            setTimeout(function () { signal(); }, 3000);
                        }
                    }
                };
                xhr.send(params);
            }
            client.update(clientPeer.channel);
        }, function (error) {
            client.trigger('error', error);
        });
    };
    signal();
    clientPeer.on('timeout', () => {
        signal();
    });
    return client;
};
const deserialize = (message) => {
    var jobj;
    if (typeof message != 'object') {
        try {
            jobj = JSON.parse(message);
        }
        catch (ex) { }
        ;
    }
    else {
        jobj = message;
    }
    return jobj;
};
Transport_1.Transport.register('webrtc', '', createClient, createServer, JSON.stringify, deserialize);
//# sourceMappingURL=WebRTC.transport.js.map
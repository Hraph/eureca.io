"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EObject_class_1 = require("../EObject.class");
const Transport_1 = require("../Transport");
const Util_class_1 = require("../Util.class");
const Primus = require('primus');
class Socket extends EObject_class_1.EObject {
    constructor(socket) {
        super();
        this.socket = socket;
        this.eureca = {};
        this.request = socket.request;
        this.id = socket.id;
        this.remoteAddress = socket.address;
        this.bindEvents();
    }
    bindEvents() {
        var __this = this;
        this.socket.on('open', function () {
            var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
            args.unshift('open');
            __this.trigger.apply(__this, args);
        });
        this.socket.on('data', function () {
            var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
            args.unshift('message');
            __this.trigger.apply(__this, args);
        });
        this.socket.on('end', function () {
            var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
            args.unshift('close');
            __this.trigger.apply(__this, args);
        });
        this.socket.on('error', function () {
            var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
            args.unshift('error');
            __this.trigger.apply(__this, args);
        });
        this.socket.on('reconnecting', function () {
            var args = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : [];
            args.unshift('reconnecting');
            __this.trigger.apply(__this, args);
        });
    }
    isAuthenticated() {
        return this.eureca.authenticated;
    }
    send(data) {
        if (this.socket.send) {
            this.socket.send(data);
        }
        else {
            this.socket.write(data);
        }
    }
    close() {
        if (this.socket.end) {
            this.socket.end();
        }
        else {
            this.socket.close();
        }
    }
    onopen(callback) {
        this.socket.on('open', callback);
    }
    onmessage(callback) {
        this.socket.on('data', callback);
    }
    onclose(callback) {
        this.socket.on('end', callback);
    }
    onerror(callback) {
        this.socket.on('error', callback);
    }
    ondisconnect(callback) {
        this.socket.on('reconnecting', callback);
    }
}
exports.Socket = Socket;
class Server {
    constructor(primus) {
        this.primus = primus;
    }
    onconnect(callback) {
        this.primus.on('connection', function (psocket) {
            var socket = new Socket(psocket);
            callback(socket);
        });
    }
}
exports.Server = Server;
var createServer = function (hook, options = {}) {
    try {
        options.pathname = options.prefix ? '/' + options.prefix : undefined;
        var primus = new Primus(hook, options);
        var primusTransport = Transport_1.Transport.get('primus');
        primusTransport.script = primus.library();
        var server = new Server(primus);
        return server;
    }
    catch (ex) {
        if (ex.name == 'PrimusError' && ex.message.indexOf('Missing dependencies') == 0) {
            console.error('Missing ', options.transformer);
            process.exit();
        }
        else {
            throw ex;
        }
    }
};
var createClient = function (uri, options = {}) {
    options.pathname = options.prefix ? '/' + options.prefix : undefined;
    options.path = options.prefix ? '/' + options.prefix : undefined;
    var socket;
    if (Util_class_1.Util.isNodejs) {
        var CSocket = Primus.createSocket(options);
        socket = new CSocket(uri);
    }
    else {
        console.log('>>> Ezelia : createClient', uri, options);
        socket = new Primus(uri, options);
    }
    var client = new Socket(socket);
    return client;
};
Transport_1.Transport.register('primus', '', createClient, createServer, (v) => v, (v) => v);
//# sourceMappingURL=Primus.transport.js.map
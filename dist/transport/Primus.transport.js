"use strict";
/// <reference path="../EObject.class.ts" />
/// <reference path="../Util.class.ts" />
/// <reference path="../Transport.ts" />
/// <reference path="../IServer.interface.ts" />
/// <reference path="../ISocket.interface.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const EObject_class_1 = require("../EObject.class");
const Transport_1 = require("../Transport");
const Util_class_1 = require("../Util.class");
const Primus = require('primus');
class Socket extends EObject_class_1.EObject {
    //public webRTCChannel:any;
    //private wRTCPeer;
    constructor(socket) {
        super();
        this.socket = socket;
        this.eureca = {};
        this.request = socket.request;
        this.id = socket.id;
        //FIXME : with nodejs 0.10.0 remoteAddress of nodejs clients is undefined (this seems to be a engine.io issue)
        this.remoteAddress = socket.address;
        //this.registerEvents(['open', 'message', 'error', 'close', 'reconnecting']);
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
    //public setupWebRTC()
    //{
    //    if (this.wRTCPeer) return;
    //    var _this = this;
    //    this.wRTCPeer = new Eureca.Transports.WebRTC.Peer();
    //    this.wRTCPeer.makeOffer(function(pc) {
    //        var webRTCSignalReq = {};
    //        webRTCSignalReq[Eureca.Protocol.signal] = pc.localDescription;
    //        _this.send(webRTCSignalReq);
    //    });
    //}
    isAuthenticated() {
        return this.eureca.authenticated;
    }
    send(data /*, webRTC=false*/) {
        //if (webRTC && this.webRTCChannel)
        //{
        //    this.webRTCChannel.send(data);
        //    return;
        //}
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
    //deprecated ?
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
    //on client connect
    onconnect(callback) {
        this.primus.on('connection', function (psocket) {
            var socket = new Socket(psocket);
            //Eureca.Util.extend(iosocket, socket);
            callback(socket);
        });
    }
}
exports.Server = Server;
var createServer = function (hook, options = {}) {
    try {
        //var primusOptions: any = {};
        options.pathname = options.prefix ? '/' + options.prefix : undefined;
        var primus = new Primus(hook, options);
        // // sync middleware
        // primus.use('eureca', function (req, res) {
        //     console.log('EURECA middleware in action');
        //     req.tag='eureca.io';
        //     console.log('>> req.tag=',req.tag);
        //     console.log('>> req=',req.headers.cookie);
        // });                
        //primus.save(__dirname + '/js/primus.js');
        var primusTransport = Transport_1.Transport.get('primus');
        //populate the client script
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
        //eioptions.transports = ['websocket', 'polling', 'flashsocket'];
        //console.log('connecting to ', uri, options);
        var CSocket = Primus.createSocket(options);
        socket = new CSocket(uri);
    }
    else {
        console.log('>>> Ezelia : createClient', uri, options);
        socket = new Primus(uri, options);
    }
    var client = new Socket(socket);
    //(<any>client).send = socket.send;
    //socket.onopen = client.onopen;
    //Eureca.Util.extend(socket, client);
    return client;
};
//Transport.register('primus', '/js/primus.js', createClient, createServer);
//set empty client script by default, it'll be populated by createClient function
Transport_1.Transport.register('primus', '', createClient, createServer, (v) => v, (v) => v);
//# sourceMappingURL=Primus.transport.js.map
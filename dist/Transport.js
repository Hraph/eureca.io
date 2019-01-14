"use strict";
/// <reference path="ISocket.interface.ts" />
/// <reference path="IServer.interface.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
class Transport {
    static register(name, clientScript, createClient, createServer, defaultSerializer, defaultDeserializer) {
        if (this.transports[name] !== undefined)
            return false;
        this.transports[name] = {
            createClient: createClient,
            createServer: createServer,
            script: clientScript,
            serialize: defaultSerializer,
            deserialize: defaultDeserializer
        };
    }
    static get(name) {
        if (name != 'webrtc') {
            //console.log('* using primus:' + name);
            //settings.transport =  'primus';
            return this.transports['primus'];
        }
        else {
            //console.log('* using ' + name);
            return this.transports[name];
        }
    }
}
Transport.transports = {};
exports.Transport = Transport;
//# sourceMappingURL=Transport.js.map
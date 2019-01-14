"use strict";
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
            return this.transports['primus'];
        }
        else {
            return this.transports[name];
        }
    }
}
Transport.transports = {};
exports.Transport = Transport;
//# sourceMappingURL=Transport.js.map
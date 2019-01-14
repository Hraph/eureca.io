"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_class_1 = require("../Util.class");
const EObject_class_1 = require("../EObject.class");
var webrtc;
if (Util_class_1.Util.isNodejs) {
    try {
        webrtc = require('wrtc');
    }
    catch (e) {
        webrtc = { unavailable: true, error: e };
    }
}
var PeerConnection = Util_class_1.Util.isNodejs ? webrtc.RTCPeerConnection : window['RTCPeerConnection'] || window['mozRTCPeerConnection'] || window['webkitRTCPeerConnection'];
var SessionDescription = Util_class_1.Util.isNodejs ? webrtc.RTCSessionDescription : window['RTCSessionDescription'] || window['mozRTCSessionDescription'] || window['webkitRTCSessionDescription'];
class WebRTCPeer extends EObject_class_1.EObject {
    constructor(settings = { reliable: true }) {
        super();
        this.id = Util_class_1.Util.randomStr(16);
        this.pc = null;
        this.offer = null;
        this.channel = null;
        this.pendingDataChannels = {};
        this.dataChannels = {};
        this.cfg = {
            "iceServers": [
                { "urls": "stun:stun.l.google.com:19302" },
                { "urls": 'stun:stun1.l.google.com:19302' }
            ]
        };
        this.channelSettings = {
            reliable: true,
            ordered: true,
            maxRetransmits: null
        };
        this.lastState = '';
        if (webrtc && webrtc.unavailable) {
            console.error("wrtc module not found\n");
            console.error(" * Please follow instructions here https://github.com/js-platform/node-webrtc to install wrtc\n");
            console.error(" * Note : WebRTC is only supported on x64 platforms\n");
            process.exit();
        }
        if (typeof settings.reliable != 'undefined')
            this.channelSettings.reliable = settings.reliable;
        if (typeof settings.maxRetransmits != 'undefined')
            this.channelSettings.maxRetransmits = settings.maxRetransmits;
        if (typeof settings.ordered !== 'undefined')
            this.channelSettings.ordered = settings.ordered;
    }
    makeOffer(callback, failureCallback) {
        var __this = this;
        var pc = new PeerConnection(this.cfg, this.con);
        this.pc = pc;
        pc.onsignalingstatechange = this.onsignalingstatechange.bind(this);
        pc.oniceconnectionstatechange = this.oniceconnectionstatechange.bind({ pc: pc, handler: this });
        pc.onicegatheringstatechange = this.onicegatheringstatechange.bind(this);
        pc.onicecandidate = function (candidate) {
            if (candidate.candidate == null) {
                if (typeof callback == 'function')
                    callback(pc);
            }
        };
        var channel = pc.createDataChannel('eureca.io', { reliable: __this.channelSettings.reliable, maxRetransmits: __this.channelSettings.maxRetransmits, ordered: __this.channelSettings.ordered });
        this.channel = channel;
        pc.createOffer()
            .then(desc => pc.setLocalDescription(desc), failureCallback)
            .then(() => { }, failureCallback);
    }
    getAnswer(pastedAnswer) {
        var data = typeof pastedAnswer == 'string' ? JSON.parse(pastedAnswer) : pastedAnswer;
        var answer = new SessionDescription(data);
        this.pc.setRemoteDescription(answer);
    }
    getOffer(pastedOffer, request, callback) {
        var __this = this;
        var data = typeof pastedOffer === 'object' ? pastedOffer : JSON.parse(pastedOffer);
        var pc = new PeerConnection(this.cfg, this.con);
        pc.onsignalingstatechange = this.onsignalingstatechange.bind(this);
        pc.oniceconnectionstatechange = this.oniceconnectionstatechange.bind({ pc: pc, handler: this });
        pc.onicegatheringstatechange = this.onicegatheringstatechange.bind(this);
        pc.onicecandidate = function (candidate) {
            if (candidate.candidate == null) {
                if (typeof callback == 'function')
                    callback(pc);
            }
        };
        pc.ondatachannel = function (evt) {
            var channel = evt.channel;
            channel.request = request;
            var label = channel.label;
            __this.pendingDataChannels[label] = channel;
            channel.binaryType = 'arraybuffer';
            channel.onopen = function () {
                __this.dataChannels[label] = channel;
                delete __this.pendingDataChannels[label];
                __this.trigger('datachannel', channel);
            };
        };
        const offer = new SessionDescription(data);
        pc.setRemoteDescription(offer)
            .then(() => pc.createAnswer(), __this.doHandleError)
            .then(desc => pc.setLocalDescription(desc), __this.doHandleError)
            .then(() => { }, __this.doHandleError);
    }
    onsignalingstatechange(state) {
    }
    oniceconnectionstatechange(state) {
        var __this = this.handler;
        var pc = this.pc;
        __this.trigger('stateChange', pc.iceConnectionState);
        __this.lastState = pc.iceConnectionState;
        if (__this.stateTimeout != undefined)
            clearTimeout(__this.stateTimeout);
        if (pc.iceConnectionState == 'disconnected' || pc.iceConnectionState == 'failed') {
            __this.trigger('disconnected');
        }
        if (pc.iceConnectionState == 'completed' || pc.iceConnectionState == 'connected') {
        }
        else {
            __this.stateTimeout = setTimeout(function () {
                __this.trigger('timeout');
            }, 5000);
        }
    }
    onicegatheringstatechange(state) {
    }
    doHandleError(error) {
        this.trigger('error', error);
    }
}
exports.WebRTCPeer = WebRTCPeer;
//# sourceMappingURL=WebRTCPeer.js.map
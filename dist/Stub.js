"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Protocol_config_1 = require("./Protocol.config");
const Util_class_1 = require("./Util.class");
const EurecaPromise_1 = require("./EurecaPromise");
class Stub {
    constructor(settings = {}) {
        this.settings = settings;
        this.serialize = settings.serialize;
        this.deserialize = settings.deserialize;
    }
    static registerCallBack(sig, cb) {
        this.callbacks[sig] = cb;
    }
    static doCallBack(sig, result, error) {
        if (!sig)
            return;
        var proxyObj = this.callbacks[sig];
        delete this.callbacks[sig];
        if (proxyObj !== undefined) {
            proxyObj.status = 1;
            if (error == null)
                proxyObj.resolve(result);
            else
                proxyObj.reject(error);
        }
    }
    invokeRemoteOld(context, fname, socket, ...args) {
        var proxyObj = {
            status: 0,
            result: null,
            error: null,
            sig: null,
            callback: function () { },
            errorCallback: function () { },
            then: function (fn, errorFn) {
                if (this.status != 0) {
                    if (this.error == null)
                        fn(this.result);
                    else
                        errorFn(this.error);
                    return;
                }
                if (typeof fn == 'function') {
                    this.callback = fn;
                }
                if (typeof errorFn == 'function') {
                    this.errorCallback = errorFn;
                }
            }
        };
        proxyObj['onReady'] = proxyObj.then;
        var RMIObj = {};
        var argsArray = args;
        var uid = Util_class_1.Util.randomStr();
        proxyObj.sig = uid;
        Stub.registerCallBack(uid, proxyObj);
        RMIObj[Protocol_config_1.Protocol.functionId] = fname;
        RMIObj[Protocol_config_1.Protocol.signatureId] = uid;
        if (argsArray.length > 0)
            RMIObj[Protocol_config_1.Protocol.argsId] = argsArray;
        socket.send(this.settings.serialize.call(context, RMIObj));
        return proxyObj;
    }
    invokeRemote(context, fname, socket, ...args) {
        let resolveCB;
        let rejectCB;
        var proxyObj = new EurecaPromise_1.EurecaPromise((resolve, reject) => {
            resolveCB = resolve;
            rejectCB = reject;
        });
        proxyObj.resolve = resolveCB;
        proxyObj.reject = rejectCB;
        var RMIObj = {};
        var argsArray = args;
        var uid = Util_class_1.Util.randomStr();
        proxyObj.sig = uid;
        Stub.registerCallBack(uid, proxyObj);
        RMIObj[Protocol_config_1.Protocol.functionId] = fname;
        RMIObj[Protocol_config_1.Protocol.signatureId] = uid;
        if (argsArray.length > 0)
            RMIObj[Protocol_config_1.Protocol.argsId] = argsArray;
        socket.send(this.settings.serialize.call(context, RMIObj));
        return proxyObj;
    }
    importRemoteFunction(handle, socket, functions) {
        var _this = this;
        if (functions === undefined)
            return;
        for (var i = 0; i < functions.length; i++) {
            (function (idx, fname) {
                var proxy = handle;
                var ftokens = fname.split('.');
                for (var i = 0; i < ftokens.length - 1; i++) {
                    proxy[ftokens[i]] = proxy[ftokens[i]] || {};
                    proxy = proxy[ftokens[i]];
                }
                var _fname = ftokens[ftokens.length - 1];
                proxy[_fname] = function (...args) {
                    args.unshift(socket);
                    args.unshift(fname);
                    args.unshift(proxy[_fname]);
                    return _this.invokeRemote.apply(_this, args);
                };
            })(i, functions[i]);
        }
    }
    sendResult(socket, sig, result, error) {
        if (!socket)
            return;
        var retObj = {};
        retObj[Protocol_config_1.Protocol.signatureId] = sig;
        retObj[Protocol_config_1.Protocol.resultId] = result;
        retObj[Protocol_config_1.Protocol.errorId] = error;
        socket.send(this.serialize(retObj));
    }
    invoke(context, handle, obj, socket) {
        var fId = parseInt(obj[Protocol_config_1.Protocol.functionId]);
        var fname = isNaN(fId) ? obj[Protocol_config_1.Protocol.functionId] : handle.contract[fId];
        var ftokens = fname.split('.');
        var func = handle.exports;
        for (var i = 0; i < ftokens.length; i++) {
            if (!func) {
                console.log('Invoke error', obj[Protocol_config_1.Protocol.functionId] + ' is not a function', '');
                this.sendResult(socket, obj[Protocol_config_1.Protocol.signatureId], null, 'Invoke error : ' + obj[Protocol_config_1.Protocol.functionId] + ' is not a function');
                return;
            }
            func = func[ftokens[i]];
        }
        if (typeof func != 'function') {
            console.log('Invoke error', obj[Protocol_config_1.Protocol.functionId] + ' is not a function', '');
            this.sendResult(socket, obj[Protocol_config_1.Protocol.signatureId], null, 'Invoke error : ' + obj[Protocol_config_1.Protocol.functionId] + ' is not a function');
            return;
        }
        try {
            obj[Protocol_config_1.Protocol.argsId] = obj[Protocol_config_1.Protocol.argsId] || [];
            var result = func.apply(context, obj[Protocol_config_1.Protocol.argsId]);
            if (socket && obj[Protocol_config_1.Protocol.signatureId] && !context.async) {
                this.sendResult(socket, obj[Protocol_config_1.Protocol.signatureId], result, null);
            }
            obj[Protocol_config_1.Protocol.argsId].unshift(socket);
            if (typeof func.onCall == 'function')
                func.onCall.apply(context, obj[Protocol_config_1.Protocol.argsId]);
        }
        catch (ex) {
            console.log('EURECA Invoke exception!! ', ex.stack);
        }
    }
}
Stub.callbacks = {};
exports.Stub = Stub;
//# sourceMappingURL=Stub.js.map
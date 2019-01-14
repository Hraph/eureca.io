"use strict";
/// <reference path="Protocol.config.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="Util.class.ts" />
/// <reference path="eurecapromise.ts" />
const Protocol_config_1 = require("./Protocol.config");
const Util_class_1 = require("./Util.class");
const EurecaPromise_1 = require("./EurecaPromise");
class Stub {
    // Constructor
    constructor(settings = {}) {
        this.settings = settings;
        //this.callbacks = {};
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
            //proxyObj.result = result;
            //proxyObj.error = error;
            if (error == null)
                proxyObj.resolve(result);
            else
                proxyObj.reject(error);
        }
    }
    //invoke remote function by creating a proxyObject and sending function name and arguments to the remote side
    invokeRemoteOld(context, fname, socket, ...args) {
        var proxyObj = {
            status: 0,
            result: null,
            error: null,
            sig: null,
            callback: function () { },
            errorCallback: function () { },
            //TODO : use the standardized promise syntax instead of onReady
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
        //onReady retro-compatibility with older eureca.io versions
        proxyObj['onReady'] = proxyObj.then;
        var RMIObj = {};
        var argsArray = args; //Array.prototype.slice.call(arguments, 0);
        var uid = Util_class_1.Util.randomStr();
        proxyObj.sig = uid;
        Stub.registerCallBack(uid, proxyObj);
        RMIObj[Protocol_config_1.Protocol.functionId] = /*this.settings.useIndexes ? idx : */ fname;
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
        var argsArray = args; //Array.prototype.slice.call(arguments, 0);
        var uid = Util_class_1.Util.randomStr();
        proxyObj.sig = uid;
        Stub.registerCallBack(uid, proxyObj);
        RMIObj[Protocol_config_1.Protocol.functionId] = /*this.settings.useIndexes ? idx : */ fname;
        RMIObj[Protocol_config_1.Protocol.signatureId] = uid;
        if (argsArray.length > 0)
            RMIObj[Protocol_config_1.Protocol.argsId] = argsArray;
        socket.send(this.settings.serialize.call(context, RMIObj));
        return proxyObj;
    }
    /**
     * Generate proxy functions allowing to call remote functions
     */
    importRemoteFunction(handle, socket, functions /*, serialize=null*/) {
        var _this = this;
        if (functions === undefined)
            return;
        for (var i = 0; i < functions.length; i++) {
            (function (idx, fname) {
                var proxy = handle;
                /* export namespace parsing */
                var ftokens = fname.split('.');
                for (var i = 0; i < ftokens.length - 1; i++) {
                    proxy[ftokens[i]] = proxy[ftokens[i]] || {};
                    proxy = proxy[ftokens[i]];
                }
                var _fname = ftokens[ftokens.length - 1];
                /* end export namespace parsing */
                //TODO : do we need to re generate proxy function if it's already declared ?
                proxy[_fname] = function (...args) {
                    args.unshift(socket);
                    args.unshift(fname);
                    args.unshift(proxy[_fname]);
                    return _this.invokeRemote.apply(_this, args);
                    /*
                    var proxyObj = {
                        status: 0,
                        result: null,
                        error: null,
                        sig:null,
                        callback: function () { },
                        errorCallback: function () { },
                        //TODO : use the standardized promise syntax instead of onReady
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
                    }
                    //onReady retro-compatibility with older eureca.io versions
                    proxyObj['onReady'] = proxyObj.then;

                    var RMIObj: any = {};


                    var argsArray = args;//Array.prototype.slice.call(arguments, 0);
                    var uid = Util.randomStr();
                    proxyObj.sig = uid;


                    Stub.registerCallBack(uid, proxyObj);



                    RMIObj[Protocol.functionId] = _this.settings.useIndexes ? idx : fname;
                    RMIObj[Protocol.signatureId] = uid;
                    if (argsArray.length > 0) RMIObj[Protocol.argsId] = argsArray;

                    //Experimental custom context sharing
                    //allow sharing global context (set in serverProxy/clientProxy) or local proxy set in the caller object
                    //if (proxy[_fname].context || handle.context) RMIObj[Protocol.context] = proxy[_fname].context || handle.context;

                    //socket.send(JSON.stringify(RMIObj));
                    socket.send(_this.settings.serialize.call(proxyObj, RMIObj));

                    return proxyObj;
                    */
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
    //invoke exported function and send back the result to the invoker
    invoke(context, handle, obj, socket) {
        var fId = parseInt(obj[Protocol_config_1.Protocol.functionId]);
        var fname = isNaN(fId) ? obj[Protocol_config_1.Protocol.functionId] : handle.contract[fId];
        /* browing export namespace */
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
        /* ***************** */
        //var func = this.exports[fname];
        if (typeof func != 'function') {
            //socket.send('Invoke error');
            console.log('Invoke error', obj[Protocol_config_1.Protocol.functionId] + ' is not a function', '');
            this.sendResult(socket, obj[Protocol_config_1.Protocol.signatureId], null, 'Invoke error : ' + obj[Protocol_config_1.Protocol.functionId] + ' is not a function');
            return;
        }
        //obj.a.push(conn); //add connection object to arguments
        try {
            obj[Protocol_config_1.Protocol.argsId] = obj[Protocol_config_1.Protocol.argsId] || [];
            var result = func.apply(context, obj[Protocol_config_1.Protocol.argsId]);
            //console.log('sending back result ', result, obj)
            if (socket && obj[Protocol_config_1.Protocol.signatureId] && !context.async) {
                this.sendResult(socket, obj[Protocol_config_1.Protocol.signatureId], result, null);
                /*
                var retObj = {};
                retObj[Protocol.signatureId] = obj[Protocol.signatureId];
                retObj[Protocol.resultId] = result;
                socket.send(JSON.stringify(retObj));
                */
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
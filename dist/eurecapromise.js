"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EurecaPromise extends Promise {
    constructor(executor) {
        super(executor);
        //public status=0;
        //public result:any = null;
        //public error: any = null;
        this.sig = null;
        this.resolve = null;
        this.reject = null;
    }
    //cancel the operation
    onReady(onfullfilled, onrejected) {
        console.warn('onReady() is deprecated, please use then() instead');
        return this.then(onfullfilled, onrejected);
    }
}
exports.EurecaPromise = EurecaPromise;
//# sourceMappingURL=eurecapromise.js.map
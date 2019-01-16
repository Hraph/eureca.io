"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EurecaPromise extends Promise {
    constructor(executor) {
        super(executor);
        this.sig = null;
        this.resolve = null;
        this.reject = null;
    }
    onReady(onfullfilled, onrejected) {
        console.warn('onReady() is deprecated, please use then() instead');
        return this.then(onfullfilled, onrejected);
    }
}
exports.EurecaPromise = EurecaPromise;
//# sourceMappingURL=EurecaPromise.js.map
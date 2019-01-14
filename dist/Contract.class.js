"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Contract {
    constructor() { }
    static parseNS(target, ns = [], parent = '') {
        for (var prop in target) {
            if (typeof target[prop] == 'function') {
                ns.push(parent + prop);
            }
            else {
                Contract.parseNS(target[prop], ns, parent + prop + '.');
            }
        }
        return ns;
    }
    static ensureContract(target, contract) {
        var contract = this.parseNS(target);
        return contract;
    }
}
exports.Contract = Contract;
//# sourceMappingURL=Contract.class.js.map
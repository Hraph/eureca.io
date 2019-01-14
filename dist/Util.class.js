"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Util {
    static randomStr(length = 10) {
        let text = '';
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < length; i++) {
            text += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return text;
    }
}
Util.isNodejs = (typeof exports == 'object' && exports);
exports.Util = Util;
//# sourceMappingURL=Util.class.js.map
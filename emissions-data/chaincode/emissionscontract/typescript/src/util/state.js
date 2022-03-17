"use strict";
/*
    SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = void 0;
const KEY_SEPARATOR = ':';
/**
 * State class. States have a class, unique key, and a lifecycle current state
 * the current state is determined by the specific subclass
 */
class State {
    constructor(keyParts) {
        this.key = State.makeKey(keyParts);
    }
    getKey() {
        return this.key;
    }
    getSplitKey() {
        return State.splitKey(this.key);
    }
    static serialize(object) {
        return Buffer.from(JSON.stringify(object));
    }
    static deserialize(buf) {
        return JSON.parse(buf.toString());
    }
    static makeKey(keyParts) {
        return keyParts.map((part) => JSON.stringify(part)).join(KEY_SEPARATOR);
    }
    static splitKey(key) {
        return key.split(KEY_SEPARATOR);
    }
}
exports.State = State;

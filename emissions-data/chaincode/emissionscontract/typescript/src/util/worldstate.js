"use strict";
/*
    SPDX-License-Identifier: Apache-2.0
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldState = void 0;
const state_1 = require("./state");
const const_1 = require("./const");
class WorldState extends state_1.State {
    constructor(stub) {
        // keys are not used for the WorldState class
        super([]);
        this.stub = stub;
    }
    addState(id, asset) {
        return __awaiter(this, void 0, void 0, function* () {
            let error;
            try {
                yield this.getState(id);
            }
            catch (err) {
                error = err;
            }
            if (!error) {
                throw new Error(`${const_1.ErrStateAlreadyExists} : asset with ID = ${id} already exists`);
            }
            return yield this.stub.putState(id, state_1.State.serialize(asset));
        });
    }
    updateState(id, asset) {
        return __awaiter(this, void 0, void 0, function* () {
            // check if asset exists or not
            yield this.getState(id);
            return yield this.stub.putState(id, state_1.State.serialize(asset));
        });
    }
    getState(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const byteState = yield this.stub.getState(id);
            if (!byteState || byteState.length === 0) {
                throw new Error(`${const_1.ErrStateNotFound} : asset with ID = ${id} not found`);
            }
            return state_1.State.deserialize(byteState);
        });
    }
    query(queryString = `{"selector": {}}`) {
        return __awaiter(this, void 0, void 0, function* () {
            let iterator;
            try {
                iterator = yield this.stub.getQueryResult(queryString);
            }
            catch (error) {
                throw new Error(`${const_1.ErrInvalidQueryString} : ${error.message}`);
            }
            return yield this.getAssetFromIterator(iterator);
        });
    }
    getAssetFromIterator(iterator) {
        return __awaiter(this, void 0, void 0, function* () {
            const out = [];
            let result = yield iterator.next();
            while (!result.done) {
                try {
                    out.push({
                        Key: result.value.key,
                        Record: state_1.State.deserialize(result.value.value),
                    });
                    result = yield iterator.next();
                }
                catch (error) {
                    break;
                }
            }
            iterator.close();
            return out;
        });
    }
}
exports.WorldState = WorldState;

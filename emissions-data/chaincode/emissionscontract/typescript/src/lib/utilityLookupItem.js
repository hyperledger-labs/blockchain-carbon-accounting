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
exports.UtilityLookupItemState = exports.UtilityLookupItem = exports.UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER = void 0;
const state_1 = require("../util/state");
const worldstate_1 = require("../util/worldstate");
/* tslint:disable:max-classes-per-file */
exports.UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER = 'org.hyperledger.blockchain-carbon-accounting.utilitylookuplist';
class UtilityLookupItem extends state_1.State {
    constructor(_item) {
        super([_item.uuid]);
        this.item = _item;
        this.item.class = exports.UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER;
        this.item.key = this.getKey();
    }
    toBuffer() {
        return state_1.State.serialize(this.item);
    }
    fromBuffer(buf) {
        return new UtilityLookupItem(state_1.State.deserialize(buf));
    }
}
exports.UtilityLookupItem = UtilityLookupItem;
class UtilityLookupItemState extends worldstate_1.WorldState {
    constructor(stub) {
        super(stub);
    }
    addUtilityLookupItem(item, uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.addState(uuid, item.item);
        });
    }
    getUtilityLookupItem(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            return new UtilityLookupItem(yield this.getState(uuid));
        });
    }
    getAllUtilityLookupItems() {
        return __awaiter(this, void 0, void 0, function* () {
            const queryString = `{"selector": {"class": "${exports.UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER}"}}`;
            return yield this.query(queryString);
        });
    }
    updateUtilityLookupItem(item, uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.updateState(uuid, item.item);
        });
    }
}
exports.UtilityLookupItemState = UtilityLookupItemState;

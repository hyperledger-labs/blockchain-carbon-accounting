/*
    SPDX-License-Identifier: Apache-2.0
*/

import { ChaincodeStub } from 'fabric-shim';
import { State } from '../util/state';
import { WorldState } from '../util/worldstate';

const UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER =
    'org.hyperledger.blockchain-carbon-accounting.utilitylookuplist';

export interface DivisionsInterface {
    division_type: string;
    division_id: string;
}
export interface UtilityLookupItemInterface {
    class?: string;
    key?: string;
    uuid: string;
    year?: string;
    utility_number?: string;
    utility_name?: string;
    country?: string;
    state_province?: string;
    divisions?: DivisionsInterface;
}

export class UtilityLookupItem extends State {
    item: UtilityLookupItemInterface;
    constructor(_item: UtilityLookupItemInterface) {
        super([_item.uuid]);
        this.item = _item;
        this.item.class = UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER;
        this.item.key = this.getKey();
    }
    toBuffer(): Uint8Array {
        return State.serialize<UtilityLookupItemInterface>(this.item);
    }
    fromBuffer(buf: Uint8Array): UtilityLookupItem {
        return new UtilityLookupItem(State.deserialize<UtilityLookupItemInterface>(buf));
    }
}

export class UtilityLookupItemState extends WorldState<UtilityLookupItemInterface> {
    private db;
    constructor(stub: ChaincodeStub, db) {
        super(stub);
        this.db = db;
    }

    async addUtilityLookupItem(item: UtilityLookupItem, uuid: string): Promise<void> {
        return await this.addState(uuid, item.item);
    }

    async getUtilityLookupItem(uuid: string): Promise<UtilityLookupItemInterface> {
        return this.db.get(uuid);
    }

    async getAllUtilityLookupItems(): Promise<UtilityLookupItemInterface[]> {
        return this.db.query(
            (doc: UtilityLookupItemInterface) => doc.class == UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER,
        );

    }
    async updateUtilityLookupItem(item: UtilityLookupItem): Promise<void> {
        return this.db.put(item);
    }
}

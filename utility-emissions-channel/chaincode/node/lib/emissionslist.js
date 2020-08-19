/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('./../ledger-api/statelist.js');

const EmissionsRecord = require('./emissions.js');

class EmissionsList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.hyperledger.blockchain-carbon-accounting.emissionslist');
        this.use(EmissionsRecord);
    }

    async addEmissionsRecord(emissionsRecord) {
        return this.addState(emissionsRecord);
    }

    async getEmissionsRecord(emissionsRecordKey) {
        return this.getState(emissionsRecordKey);
    }

    async updateEmissionsRecord(emissionsRecord) {
        return this.updateState(emissionsRecord);
    }
}


module.exports = EmissionsList;

/*
SPDX-License-Identifier: Apache-2.0
*/

"use strict";

// Utility class for collections of ledger states --  a state list
const StateList = require("./../ledger-api/statelist.js");

const EmissionsRecord = require("./emissions.js");

class EmissionsList extends StateList {
  constructor(ctx) {
    super(ctx, "org.hyperledger.blockchain-carbon-accounting.emissionslist");
    this.use(EmissionsRecord);
  }

  async addEmissionsRecord(emissionsRecord, uuid) {
    return this.addState(emissionsRecord, uuid);
  }

  async getEmissionsRecord(uuid) {
    return this.getState(uuid);
  }

  async updateEmissionsRecord(emissionsRecord) {
    return this.updateState(emissionsRecord);
  }

  async getAllEmissionRecords(queryData) {
    return this.getAllState(queryData);
  }
}

module.exports = EmissionsList;

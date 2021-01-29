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

  async updateEmissionsRecord(emissionsRecord, uuid) {
    return this.updateState(emissionsRecord, uuid);
  }

  async getAllEmissionRecords(queryData) {
    return this.getAllStateByUtilityIdAndPartyId(queryData);
  }

  async getAllEmissionsDataByDateRange(queryData) {
    const allResults = [];
    var stringQuery = `{"selector": {"fromDate": {"$gte": "${queryData.fromDate}"}, "thruDate": {"$lte": "${queryData.thruDate}"}}}`;
    const iterator = await this.ctx.stub.getQueryResult(stringQuery);
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString("utf8");
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(err);
        record = strValue;
      }
      allResults.push({ Key: result.value.key, Record: record });
      result = await iterator.next();
    }
    return JSON.stringify(allResults);
  }
}

module.exports = EmissionsList;

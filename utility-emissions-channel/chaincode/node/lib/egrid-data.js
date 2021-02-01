// this file in the chaincode stores the lists UtilityEmissionsFactorList and 
// UtilityLookupList which are formerly stored on dynamodb
//
// UtilityEmissionsFactorList is composed of many UtilityEmissionsFactorItem
//   (formerly known as UTILITY_EMISSION_FACTORS on dynamodb)
// UtilityLookupList is composed of many UtilityLookupItem
//   (formerly known as UTILITY_LOOKUP on dynamodb)

"use strict";

// Utility class for ledger state, statelist
const State = require("./../ledger-api/state.js");
const StateList = require("./../ledger-api/statelist.js");

// Class for utility emissions factor item (within list)
class UtilityEmissionsFactorItem extends State {
  constructor(obj) {
    super(UtilityEmissionsFactorItem.getClass(), [obj.uuid, obj.year, obj.division_type, obj.division_id]);
    Object.assign(this, obj);
  }
  static fromBuffer(buffer) {
    return UtilityEmissionsFactorItem.deserialize(buffer);
  }
  toBuffer() {
    return Buffer.from(JSON.stringify(this));
  }
  static deserialize(data) {
    return State.deserializeClass(data, UtilityEmissionsFactorItem);
  }

  static createInstance(
    uuid,
    year,
    country,
    division_type,
    division_id,
    division_name,
    net_generation,
    net_generation_uom,
    co2_equivalent_emissions,
    co2_equivalent_emissions_uom,
    source,
    non_renewables,
    renewables
  ) {
    return new UtilityEmissionsFactorItem({
      uuid,
      year,
      country,
      division_type,
      division_id,
      division_name,
      net_generation,
      net_generation_uom,
      co2_equivalent_emissions,
      co2_equivalent_emissions_uom,
      source,
      non_renewables,
      renewables
    });
  }

  static getClass() {
    return "org.hyperledger.blockchain-carbon-accounting.utilityemissionsfactoritem";
  }
}

// Class for utility emissions factor item (within list)
class UtilityLookupItem extends State {
  constructor(obj) {
    super(UtilityLookupItem.getClass(), [obj.uuid]);
    Object.assign(this, obj);
  }
  static fromBuffer(buffer) {
    return UtilityLookupItem.deserialize(buffer);
  }
  toBuffer() {
    return Buffer.from(JSON.stringify(this));
  }
  static deserialize(data) {
    return State.deserializeClass(data, UtilityLookupItem);
  }

  static createInstance(
    uuid,
    year,
    utility_number,
    utility_name,
    country,
    state_province,
    divisions
  ) {
    return new UtilityLookupItem({
      uuid,
      year,
      utility_number,
      utility_name,
      country,
      state_province,
      divisions
    });
  }

  static getClass() {
    return "org.hyperledger.blockchain-carbon-accounting.utilitylookupitem";
  }
}

// Class for utility emissions factor list (within list)
class UtilityEmissionsFactorList extends StateList {
  constructor(ctx) {
    super(ctx, "org.hyperledger.blockchain-carbon-accounting.utilityemissionsfactorlist");
    this.use(UtilityEmissionsFactorItem);
  }
  async addUtilityEmissionsFactor(utilityEmissionsFactor, uuid) {
    return this.addState(utilityEmissionsFactor, uuid);
  }
  async getUtilityEmissionsFactor(uuid) {
    return this.getState(uuid);
  }
  async updateUtilityEmissionsFactor(utilityEmissionsFactor, uuid) {
    return this.updateState(utilityEmissionsFactor, uuid);
  }
  async getUtilityEmissionsFactorsByDivision(queryData) {
    // docs on query: https://docs.couchdb.org/en/stable/intro/tour.html?highlight=gte#running-a-mango-query
    let stringQuery;
    if (queryData.year) {
        let stringQuery =  `{"selector" : {"division_id" : {"$eq": "${queryData.division_id}"}, "division_type": {"$eq": "${queryData.division_type}"}, "year": {"$eq": "${queryData.year}"}}}`
    } else {
        let stringQuery =  `{"selector" : {"division_id" : {"$eq": "${queryData.division_id}"}, "division_type": {"$eq": "${queryData.division_type}"}}}`
    }
    let iterator = await this.ctx.stub.getQueryResult(stringQuery);
    let results = [];
    let result = await iterator.next();
    while (!result.done) {
      let strValue = Buffer.from(result.value.value.toString()).toString("utf8");
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(err);
        record = strValue;
      }
      results.push({ Key: result.value.key, Record: record });
      result = await iterator.next();
    }
    return JSON.stringify(results);
  }
}

// Class for utility emissions factor list (within list)
class UtilityLookupList extends StateList {
  constructor(ctx) {
    super(ctx, "org.hyperledger.blockchain-carbon-accounting.utilitylookuplist");
    this.use(UtilityLookupItem);
  }
  async addUtilityLookupItem(utilityLookupItem, uuid) {
    return this.addState(utilityLookupItem, uuid);
  }
  async getUtilityLookupItem(uuid) {
    return this.getState(uuid);
  }
  async getAllUtilityLookupItems() {
    return this.getAllState();
  }
  async updateUtilityLookupItem(utilityLookupItem, uuid) {
    return this.updateState(utilityLookupItem, uuid);
  }
}

module.exports = {
  UtilityEmissionsFactorItem,
  UtilityEmissionsFactorList,
  UtilityLookupItem,
  UtilityLookupList
}

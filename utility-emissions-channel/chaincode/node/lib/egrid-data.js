// this file in the chaincode stores the lists UtilityEmissionsFactorList and 
// UtilityLookupList which are formerly stored on dynamodb
//
// UtilityEmissionsFactorList is composed of many UtilityEmissionsFactorItem
// UtilityLookupList is composed of many UtilityLookupItem

"use strict";

// Utility class for ledger state, statelist
const State = require("./../ledger-api/state.js");
const StateList = require("./../ledger-api/statelist.js");

// Class for utility emissions factor item (within list)
class UtilityEmissionsFactorItem extends State {
  constructor(obj) {
    super(UtilityEmissionsFactorItem.getClass());
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
    super(UtilityLookupItem.getClass());
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
  async getAllUtilityEmissionsFactor(queryData) {
    return this.getAllState(queryData);
  }
}

// Class for utility emissions factor list (within list)
class UtilityLookupList extends StateList {
  constructor(ctx) {
    super(ctx, "org.hyperledger.blockchain-carbon-accounting.utilityemissionsfactorlist");
    this.use(UtilityLookupItem);
  }
  async addUtilityLookupItem(utilityLookupItem, uuid) {
    return this.addState(utilityLookupItem, uuid);
  }
  async getUtilityLookupItem(uuid) {
    return this.getState(uuid);
  }
  async updateUtilityLookupItem(utilityLookupItem, uuid) {
    return this.updateState(utilityLookupItem, uuid);
  }
  async getAllUtilityLookupItem(queryData) {
    return this.getAllState(queryData);
  }
}

module.exports = {
  UtilityEmissionsFactorItem: UtilityEmissionsFactorItem,
  UtilityEmissionsFactorList: UtilityEmissionsFactorList,
  UtilityLookupItem: UtilityLookupItem,
  UtilityLookupList: UtilityLookupList
}

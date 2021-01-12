/*
SPDX-License-Identifier: Apache-2.0
*/

"use strict";

// Utility class for ledger state
const State = require("./../ledger-api/state.js");

/**
 * EmissionsRecord class extends State class
 * Class will be used by application and smart contract to define a paper
 */
class EmissionsRecord extends State {
  constructor(obj) {
    // TODO: convert from and thru dates to numeric value, ie Date.now()
    super(EmissionsRecord.getClass(), [obj.utilityId, obj.partyId, obj.fromDate, obj.thruDate]);
    Object.assign(this, obj);
  }

  /**
   * Basic getters and setters
   */
  getUuid() {
    return this.uuid;
  }
  setUuid(newUuid) {
    this.uuid = newUuid;
  }
  getFromDate() {
    return this.fromDate;
  }

  setFromDate(newFromDate) {
    this.fromDate = newFromDate;
  }

  getThruDate() {
    return this.thruDate;
  }

  setThruDate(newThruDate) {
    this.thruDate = newThruDate;
  }

  getUtilityId() {
    return this.utilityId;
  }

  setUtilityId(newUtilityId) {
    this.utilityId = newUtilityId;
  }

  getPartyId() {
    return this.partyId;
  }

  setPartyId(newPartyId) {
    this.partyId = newPartyId;
  }

  getEmissionsAmount() {
    return this.emissionsAmount;
  }

  setEmissionsAmount(newEmissionsAmount) {
    this.emissionsAmount = newEmissionsAmount;
  }

  getRenewableEnergyUseAmount() {
    return this.renewableEnergyUseAmount;
  }

  setRenewableEnergyUseAmount(newRenewableEnergyUseAmount) {
    this.renewableEnergyUseAmount = newRenewableEnergyUseAmount;
  }

  getNonrenewableEnergyUseAmount() {
    return this.nonrenewableEnergyUseAmount;
  }

  setNonrenewableEnergyUseAmount(newNonrenewableEnergyUseAmount) {
    this.nonrenewableEnergyUseAmount = newNonrenewableEnergyUseAmount;
  }

  getFactorSource() {
    return this.factorSource;
  }

  setFactorSource(newfactorSource) {
    this.factorSource = newfactorSource;
  }

  setEnergyUseUom() {
    return this.energyUseUom;
  }
  getEnergyUseUom(newEnergyUseUom) {
    this.energyUseUom = newEnergyUseUom;
  }

  getUrl() {
    return this.url;
  }
  setUrl(newUrl) {
    this.url = newUrl;
  }

  getMd5() {
    return this.md5;
  }
  setMd5(newMd5) {
    this.md5 = newMd5;
  }

  getTokenId() {
    return this.tokenId;
  }
  setTokenId(newTokenId) {
    this.tokenId = newTokenId;
  }

  static fromBuffer(buffer) {
    return EmissionsRecord.deserialize(buffer);
  }

  toBuffer() {
    return Buffer.from(JSON.stringify(this));
  }

  /**
   * Deserialize a state data to commercial paper
   * @param {Buffer} data to form back into the object
   */
  static deserialize(data) {
    return State.deserializeClass(data, EmissionsRecord);
  }

  /**
   * Factory method to create an Emissions Record object
   */
  static createInstance(
    uuid,
    utilityId,
    partyId,
    fromDate,
    thruDate,
    emissionsAmount,
    renewableEnergyUseAmount,
    nonrenewableEnergyUseAmount,
    energyUseUom,
    factorSource,
    url,
    md5,
    tokenId
  ) {
    return new EmissionsRecord({
      uuid,
      utilityId,
      partyId,
      fromDate,
      thruDate,
      emissionsAmount,
      renewableEnergyUseAmount,
      nonrenewableEnergyUseAmount,
      energyUseUom,
      factorSource,
      url,
      md5,
      tokenId,
    });
  }

  static getClass() {
    return "org.hyperledger.blockchain-carbon-accounting.emissionsrecord";
  }
}

module.exports = EmissionsRecord;

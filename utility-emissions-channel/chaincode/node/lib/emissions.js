/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('./../ledger-api/state.js');

/**
 * EmissionsRecord class extends State class
 * Class will be used by application and smart contract to define a paper
 */
class EmissionsRecord extends State {
    
    constructor(obj) {
        super(EmissionsRecord.getClass(), [obj.utilityId, obj.partyId, obj.fromDate, obj.thruDate]);
        Object.assign(this, obj);
    }

    /**
     * Basic getters and setters
    */
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
    
    getEmissionsUom() {
        return this.emissionsUom;
    }

    setEmissionsUom(newEmissionsUom) {
        this.emissionsUom = newEmissionsUom;
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
    static createInstance(utilityId, partyId, fromDate, thruDate, emissionsAmount, emissionsUom) {
        return new EmissionsRecord({ utilityId, partyId, fromDate, thruDate, emissionsAmount, emissionsUom });
    }

    static getClass() {
        return 'org.hyperledger.blockchain-carbon-accounting.emissionsrecord';
    }
}

module.exports = EmissionsRecord;

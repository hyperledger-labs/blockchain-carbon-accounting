/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// PaperNet specifc classes
const EmissionsRecord = require('./emissions.js');
const EmissionsList = require('./emissionslist.js');

/**
 * A custom context provides easy access to list of all emissions records
 */
class EmissionsRecordContext extends Context {

    constructor() {
        super();
        // All papers are held in a list of papers
        this.emissionsList = new EmissionsList(this);
    }

}

/**
 * Define emissions record smart contract by extending Fabric Contract class
 *
 */
class EmissionsRecordContract extends Contract {

    constructor() {
        // Unique namespace when multiple contracts per chaincode file
        super('org.hyperledger.blockchain-carbon-accounting.emissionsrecord');
    }

    /**
     * Define a custom context for emissions record
    */
    createContext() {
        return new EmissionsRecordContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        console.log('Instantiate the contract');
    }

    /**
     * Store the emissions record
     *
     * @param {Context} ctx the transaction context
     * @param {String} Id for the utility
     * @param {String} Id for the party (company) which buys power from utility
     * @param {String} from date of the time period
     * @param {String} thru date of the time period
     * @param {String} maturityDateTime paper maturity date
     * @param {Double} energy usage amount
     * @param {String} UOM of energy usage amount -- ie kwh
    */
    async recordEmissions(ctx, utilityId, partyId, fromDate, thruDate, energyUseAmount, energyUseUom) {

        // do some calculation
        emissionsAmount = energyUseAmount * 0.1;
        emissionsUom = "TONS";
        
        // create an instance of the emissions record
        let emissionsRecord = EmissionsRecord.createInstance(utilityId, partyId, fromDate, thruDate, emissionsAmount, emissionsUom);

        // Add the emissions record to the list of all similar emissions records in the ledger world state
        await ctx.emissionsList.addEmissionsRecord(emissionsRecord);

        // Must return a serialized paper to caller of smart contract
        return paper;
    }

    /**
     * Get the emissions record
     *
     * @param {Context} ctx the transaction context
     * @param {String} Id for the utility
     * @param {String} Id for the party (company) which buys power from utility
     * @param {String} from date of the time period
     * @param {String} thru date of the time period
     */
    async getEmissionsData(ctx, utilityId, partyId, fromDate, thruDate) {

        // Retrieve the current paper using key fields provided
        let emissionsRecordKey = EmissionsRecord.makeKey([ utilityId, partyId, fromDate, thruDate]);
        let emissionsRecord = await ctx.emissionsList.getEmissionsRecord(emissionsRecordKey);

        return emissionsRecord;
    }

}

module.exports = EmissionsRecordContract;

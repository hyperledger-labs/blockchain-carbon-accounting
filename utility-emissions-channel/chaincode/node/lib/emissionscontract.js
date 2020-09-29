/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// EmissionsRecord specifc classes
const EmissionsRecord = require('./emissions.js');
const EmissionsList = require('./emissionslist.js');
const https = require('https');

/**
 * A custom context provides easy access to list of all emissions records
 */
class EmissionsRecordContext extends Context {

    constructor() {
        super();
        // All emissions records are held in a list
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
     * Initialize any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async init(ctx) {
        // No initialization right now
        console.log('Initializing the contract');
    }

    async get_co2_emissions(utilityId, thruDate, energyUseAmount, energyUseUom, emissionsUom) {

        return new Promise(function(resolve, reject) {
            let url = 'https://3qiouxr7yk.execute-api.us-east-1.amazonaws.com/dev/get-co2-emissions?utility=' + utilityId;
            url += '&thru_date=' + thruDate;
            url += '&usage=' + energyUseAmount;
            url += '&emssions_uom=' + emissionsUom;
            url += '&usage_uom=' + energyUseUom;
            https.get(url, (resp) => {
              let data = '';

              // A chunk of data has been recieved.
              resp.on('data', (chunk) => {
                data += chunk;
              });

              // The whole response has been received. Print out the result.
              resp.on('end', () => {
                let d = JSON.parse(data);
                if (d.statusCode === 200) {
                    return resolve(d.body);
                } else {
                    return reject(JSON.stringify(d));
                }
              });

            }).on("error", (err) => {
              return reject(JSON.stringify(err));
            });
        });
    }

    /**
     * Store the emissions record
     *
     * @param {Context} ctx the transaction context
     * @param {String} Id for the utility
     * @param {String} Id for the party (company) which buys power from utility
     * @param {String} from date of the time period
     * @param {String} thru date of the time period
     * @param {Double} energy usage amount
     * @param {String} UOM of energy usage amount -- ie kwh
    */
    async recordEmissions(ctx, utilityId, partyId, fromDate, thruDate, energyUseAmount, energyUseUom) {

        // TODO: use a constants file
        var emissionsUom = "TONS";

        // get emissions factors from eGRID database; convert energy use to emissions factor UOM; calculate energy use
        let calc = await this.get_co2_emissions(utilityId, thruDate, energyUseAmount, energyUseUom, emissionsUom);
        var emissionsAmount = calc.Emissions.value;
        
        // create an instance of the emissions record
        let emissionsRecord = EmissionsRecord.createInstance(utilityId, partyId, fromDate, thruDate, emissionsAmount, emissionsUom);

        // Add the emissions record to the list of all similar emissions records in the ledger world state
        await ctx.emissionsList.addEmissionsRecord(emissionsRecord);

        // Must return a serialized emissionsRecord to caller of smart contract
        return emissionsRecord;
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

        // Retrieve the current emissions record using key fields provided
        let emissionsRecordKey = EmissionsRecord.makeKey([ utilityId, partyId, fromDate, thruDate]);
        let emissionsRecord = await ctx.emissionsList.getEmissionsRecord(emissionsRecordKey);

        return emissionsRecord;
    }

}

module.exports = EmissionsRecordContract;

"use strict";
/*
    SPDX-License-Identifier: Apache-2.0
*/
/**
 * The release of GHG into the atmosphere depends mainly on the activity and the product.
 * In order to estimate GHG emissions per unit of available activity,
 * we need to use a factor called emission factor (EF).
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmissionsFactorState = exports.EmissionsFactor = exports.EMISSIONS_FACTOR_CLASS_IDENTIFER = void 0;
const const_1 = require("../util/const");
const state_1 = require("../util/state");
const worldstate_1 = require("../util/worldstate");
const emissions_calc_1 = require("./emissions-calc");
exports.EMISSIONS_FACTOR_CLASS_IDENTIFER = 'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem';
class EmissionsFactor extends state_1.State {
    constructor(_factor) {
        super([_factor.uuid, _factor.year, _factor.division_type, _factor.division_id]);
        this.factor = _factor;
        this.factor.class = exports.EMISSIONS_FACTOR_CLASS_IDENTIFER;
        this.factor.key = this.getKey();
    }
    toBuffer() {
        return state_1.State.serialize(this.factor);
    }
    fromBuffer(buf) {
        return new EmissionsFactor(state_1.State.deserialize(buf));
    }
}
exports.EmissionsFactor = EmissionsFactor;
class EmissionsFactorState extends worldstate_1.WorldState {
    constructor(stub) {
        super(stub);
    }
    addEmissionsFactor(factor, uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.addState(uuid, factor.factor);
        });
    }
    getEmissionsFactor(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            return new EmissionsFactor(yield this.getState(uuid));
        });
    }
    updateEmissionsFactor(factor, uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.updateState(uuid, factor.factor);
        });
    }
    getEmissionsFactorsByDivision(divisionID, divisionType, year) {
        return __awaiter(this, void 0, void 0, function* () {
            const maxYearLookup = 5; // if current year not found, try each preceding year up to this many times
            let retryCount = 0;
            let queryString = '';
            let results = [];
            while (results.length === 0 && retryCount <= maxYearLookup) {
                if (year !== undefined) {
                    queryString = `{
                "selector" : {
                  "class": {
                     "$eq": "${exports.EMISSIONS_FACTOR_CLASS_IDENTIFER}"
                  },
                  "division_id" : {
                    "$eq": "${divisionID}"
                  },
                  "division_type": {
                    "$eq": "${divisionType}"
                  },
                  "year": {
                    "$eq": "${year + retryCount * -1}"
                }
                }
              }`;
                }
                else {
                    queryString = `{
            "selector" : {
              "class": {
                 "$eq": "${exports.EMISSIONS_FACTOR_CLASS_IDENTIFER}"
              },
              "division_id" : {
                "$eq": "${divisionID}"
              },
              "division_type": {
                "$eq": "${divisionType}"
              }
            }
          }`;
                }
                const iterator = yield this.stub.getQueryResult(queryString);
                results = yield this.getAssetFromIterator(iterator);
                retryCount++;
            }
            if (results.length === 0) {
                throw new Error(`${const_1.ErrStateNotFound} : failed to get Utility Emissions Factors By division`);
            }
            return results;
        });
    }
    // used by recordEmissions
    getEmissionsFactorByLookupItem(lookup, thruDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const hasStateData = lookup.state_province !== '';
            const isNercRegion = lookup.divisions.division_type.toLowerCase() === 'nerc_region';
            const isNonUSCountry = lookup.divisions.division_type.toLowerCase() === 'country' &&
                lookup.divisions.division_id.toLowerCase() !== 'usa';
            let divisionID;
            let divisionType;
            let year;
            if (hasStateData) {
                divisionID = lookup.state_province;
                divisionType = 'STATE';
            }
            else if (isNercRegion) {
                divisionID = lookup.divisions.division_id;
                divisionType = lookup.divisions.division_type;
            }
            else if (isNonUSCountry) {
                divisionID = lookup.divisions.division_id;
                divisionType = 'Country';
            }
            else {
                divisionID = 'USA';
                divisionType = 'Country';
            }
            try {
                year = (0, emissions_calc_1.getYearFromDate)(thruDate);
            }
            catch (error) {
                console.error('could not fetch year');
                console.error(error);
            }
            console.log('fetching utilityFactors');
            const utilityFactors = yield this.getEmissionsFactorsByDivision(divisionID, divisionType, year);
            console.log(utilityFactors);
            if (utilityFactors.length === 0) {
                throw new Error('No utility emissions factor found for given query');
            }
            return new EmissionsFactor(utilityFactors[0].Record);
        });
    }
}
exports.EmissionsFactorState = EmissionsFactorState;

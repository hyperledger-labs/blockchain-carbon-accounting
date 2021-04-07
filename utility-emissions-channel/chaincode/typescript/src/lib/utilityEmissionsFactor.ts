/*
    SPDX-License-Identifier: Apache-2.0
*/

/* tslint:disable:max-classes-per-file */
import { ChaincodeStub, Iterators } from 'fabric-shim';
import { State } from '../util/state';
import { WorldState } from '../util/worldstate';

const UTILITY_EMISSIONS_FACTOR_CLASS_IDENTIFER =
  'org.hyperledger.blockchain-carbon-accounting.utilityemissionsfactoritem';

interface UtilityEmissionsFactorInterface {
  class: string;
  uuid: string;
  year: string;
  country: string;
  division_type: string;
  division_id: string;
  division_name: string;
  net_generation: string;
  net_generation_uom: string;
  co2_equivalent_emissions: string;
  co2_equivalent_emissions_uom: string;
  source: string;
  non_renewables: string;
  renewables: string;
  percent_of_renewables: string;
}

export class UtilityEmissionsFactor extends State {
  factor: UtilityEmissionsFactorInterface;
  constructor(_factor: UtilityEmissionsFactorInterface) {
    super([
      _factor.uuid,
      _factor.year,
      _factor.year,
      _factor.division_type,
      _factor.division_id,
    ]);
    Object.assign(this.factor, _factor);
    this.factor.class = UTILITY_EMISSIONS_FACTOR_CLASS_IDENTIFER;
  }
  toBuffer(): Uint8Array {
    return State.serialize<UtilityEmissionsFactorInterface>(this.factor);
  }
  fromBuffer(buf: Uint8Array): UtilityEmissionsFactor {
    return new UtilityEmissionsFactor(
      State.deserialize<UtilityEmissionsFactorInterface>(buf)
    );
  }
}

export class UtilityEmissionsFactorState extends WorldState<UtilityEmissionsFactorInterface> {
  constructor(stub: ChaincodeStub) {
    super(stub);
  }
  async addUtilityEmissionsFactor(
    factor: UtilityEmissionsFactor,
    uuid: string
  ): Promise<void> {
    return await this.addState(uuid, factor.factor);
  }
  async getUtilityEmissionsFactor(
    uuid: string
  ): Promise<UtilityEmissionsFactor> {
    return new UtilityEmissionsFactor(await this.getState(uuid));
  }
  async updateUtilityEmissionsFactor(
    factor: UtilityEmissionsFactor,
    uuid: string
  ): Promise<void> {
    return await this.addState(uuid, factor.factor);
  }
  async getUtilityEmissionsFactorsByDivision(
    divisionID: string,
    divisionType: string,
    year?: number
  ): Promise<{
    [key: string]: UtilityEmissionsFactorInterface;
  }> {
    const maxYearLookup = 5; // if current year not found, try each preceding year up to this many times
    let retryCount = 0;
    let queryString = '';
    let iterator: Iterators.StateQueryIterator;
    while (!iterator && retryCount <= maxYearLookup) {
      if (year !== undefined) {
        queryString = `{
                "selector" : {
                  "class": {
                     "$eq": "${UTILITY_EMISSIONS_FACTOR_CLASS_IDENTIFER}"
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
      } else {
        queryString = `{
            "selector" : {
              "class": {
                 "$eq": "${UTILITY_EMISSIONS_FACTOR_CLASS_IDENTIFER}"
              },
              "division_id" : {
                "$eq": "${divisionID}"
              },
              "division_type": {
                "$eq": "${divisionType}"
              }
            }
          }`;
        iterator = await this.stub.getQueryResult(queryString);
        retryCount++;
      }
      return this.getAssetFromIterator(iterator);
    }
  }
}

import { createStubInstance } from 'sinon';
import { ChaincodeStub } from 'fabric-shim';

import {
  UtilityEmissionsFactor,
  UtilityEmissionsFactorInterface,
  UtilityEmissionsFactorState,
} from '../../src/lib/utilityEmissionsFactor';
import { assert } from 'chai';

const testData: UtilityEmissionsFactorInterface = {
  uuid: 'id',
  year: '2021',
  division_type: 'division_type',
  division_id: 'division_id',
};

describe('lib/utilityEmissionsFactor.ts', () => {
  let states: { [key: string]: Uint8Array };
  let stub: UtilityEmissionsFactorState;
  beforeEach(() => {
    states = {};
    const ccStub = createStubInstance(ChaincodeStub);
    stub = new UtilityEmissionsFactorState(ccStub);
    ccStub.putState.callsFake(
      async (key: string, value: Uint8Array): Promise<void> => {
        states[key] = value;
      }
    );
    ccStub.getState.callsFake(
      async (key): Promise<Uint8Array> => {
        return states[key];
      }
    );
  });
  describe('addUtilityEmissionsFactor', () => {
    it('success adding new utility factor', async () => {
      const factor = new UtilityEmissionsFactor(testData);
      await stub.addUtilityEmissionsFactor(factor, factor.getKey());
      assert.exists(states[factor.getKey()]);
      assert.deepEqual(states[factor.getKey()], factor.toBuffer());
    });
  });
  describe('getUtilityEmissionsFactor', () => {
    it('success retrieving state', async () => {
      const factor = new UtilityEmissionsFactor(testData);
      states[factor.getKey()] = factor.toBuffer();
      let error: Error;
      let asset: UtilityEmissionsFactor;
      try {
        asset = await stub.getUtilityEmissionsFactor(factor.getKey());
      } catch (err) {
        error = err as Error;
      }
      assert.exists(asset);
      assert.notExists(error);
      assert.deepEqual(asset.toBuffer(), factor.toBuffer());
    });
    it('error generate while retrieving non-existing asset', async () => {
      const factor = new UtilityEmissionsFactor(testData);
      let error: Error;
      let asset: UtilityEmissionsFactor;
      try {
        asset = await stub.getUtilityEmissionsFactor(factor.getKey());
      } catch (err) {
        error = err as Error;
      }
      assert.notExists(asset);
      assert.exists(error);
    });
  });

  // TODO : add getUtilityEmissionsFactorsByDivision
});

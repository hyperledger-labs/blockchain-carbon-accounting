import { assert } from 'chai';
import { ChaincodeStub } from 'fabric-shim';
import { createStubInstance } from 'sinon';
import {
    EmissionsFactor,
    EmissionsFactorInterface,
    EmissionsFactorState,
} from '../../src/lib/emissionsFactor';

const testData: EmissionsFactorInterface = {
    class: '',
    type: '',
    uuid: 'id',
    year: '2021',
    division_type: 'division_type',
    division_id: 'division_id',
    scope: '1',
    level_1: 'string',
    level_2: 'string',
    level_3: 'string',
};

describe('lib/emissionsFactor.ts', () => {
    let states: { [key: string]: Uint8Array };
    let stub: EmissionsFactorState;
    beforeEach(() => {
        states = {};
        const ccStub = createStubInstance(ChaincodeStub);
        stub = new EmissionsFactorState(ccStub);
        ccStub.putState.callsFake(async (key: string, value: Uint8Array): Promise<void> => {
            states[key] = value;
        });
        ccStub.getState.callsFake(async (key): Promise<Uint8Array> => {
            return states[key];
        });
    });
    describe('addEmissionsFactor', () => {
        it('success adding new utility factor', async () => {
            const factor = new EmissionsFactor(testData);
            await stub.addEmissionsFactor(factor, factor.getKey());
            assert.exists(states[factor.getKey()]);
            assert.deepEqual(states[factor.getKey()], factor.toBuffer());
        });
    });
    describe('getEmissionsFactor', () => {
        it('success retrieving state', async () => {
            const factor = new EmissionsFactor(testData);
            states[factor.getKey()] = factor.toBuffer();
            let error: Error;
            let asset: EmissionsFactor;
            try {
                asset = await stub.getEmissionsFactor(factor.getKey());
            } catch (err) {
                error = err as Error;
            }
            assert.exists(asset);
            assert.notExists(error);
            assert.deepEqual(asset.toBuffer(), factor.toBuffer());
        });
        it('error generate while retrieving non-existing asset', async () => {
            const factor = new EmissionsFactor(testData);
            let error: Error;
            let asset: EmissionsFactor;
            try {
                asset = await stub.getEmissionsFactor(factor.getKey());
            } catch (err) {
                error = err as Error;
            }
            assert.notExists(asset);
            assert.exists(error);
        });
    });

    // TODO : add getEmissionsFactorsByDivision
});

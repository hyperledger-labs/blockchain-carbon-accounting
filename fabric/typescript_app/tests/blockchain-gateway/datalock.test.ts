import chai from 'chai';
import { config } from 'dotenv';
import { v4 as uuid4 } from 'uuid';
import BCGatewayConfig from '../../src/blockchain-gateway-lib/config';
import { DataLockGateway } from '../../src/blockchain-gateway/datalock';
import EmissionsDataGateway from '../../src/blockchain-gateway/emissionsChannel';
import { IFabricTxCaller, TxState } from '../../src/blockchain-gateway-lib/I-gateway';
import Signer from '../../src/blockchain-gateway-lib/signer';
import { setup } from '../../src/utils/logger';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const should = chai.should();

import { mockUtilityID2 } from '../constants';

setup('DEBUG', 'DEBUG');

config();

describe('DataLockGateway', () => {
    const bcConfig = new BCGatewayConfig();
    describe('vault', () => {
        const signer = new Signer('vault', 'inMemoryKeychain', 'plain');
        const adminVaultToken = 'tokenId';
        const org = bcConfig.fabricConnector();
        const gateway = new DataLockGateway({
            fabricConnector: org.connector,
            signer: signer,
        });
        const adminCaller: IFabricTxCaller = {
            userId: 'admin',
            vaultToken: adminVaultToken,
        };

        let emissionID: string;
        before(async () => {
            await org.connector.enroll(signer.fabric(adminCaller), {
                enrollmentID: 'admin',
                enrollmentSecret: 'adminpw',
                caId: org.caID,
                mspId: org.orgMSP,
            });
            const data = await new EmissionsDataGateway({
                fabricConnector: org.connector,
                signer: signer,
            }).recordEmissions(adminCaller, {
                endpoint: 'http://oracle:3002/emissionsRecord',
                query: 'getEmissionsByUtilityLookUpItem',
                queryParams: {
                    uuid: mockUtilityID2,
                    usage: 100,
                    usageUOM: 'kWh',
                    thruDate: '2021-05-07T10:10:09Z',
                },
                //utilityId: mockUtilityID2,
                partyId: uuid4(),
                fromDate: '2020-05-07T10:10:09Z',
                thruDate: '2021-05-07T10:10:09Z',
                //energyUseAmount: 100,
                //energyUseUom: 'kWh',
                url: '',
                md5: '',
            });
            emissionID = data.uuid;
        });
        const txID = uuid4();
        it('startTx', async () => {
            const tx = await gateway.startTransitionProcess(adminCaller, txID);
            tx.tx_id.should.be.eq(txID);
            tx.state.should.be.eq(TxState.PROCESSING);
        });
        it('should update tx stage with lock', async () => {
            const resp = await gateway.stageUpdate(adminCaller, {
                tx_id: txID,
                name: 'GetValidEmissions',
                data_locks: {
                    emissions: {
                        keys: [emissionID],
                        params: ['getValidEmissions', emissionID],
                    },
                },
            });
            console.log(resp);
        });
        const tokenId = '0xTokenAddress';
        const partyID = 'partyID-1';

        it('should update tx stage with storage', async () => {
            await gateway.stageUpdate(adminCaller, {
                tx_id: txID,
                name: 'RecordMintedToken',
                storage: {
                    tokenId: tokenId,
                },
            });
        });

        it('should update tx stage with un-lock', async () => {
            await gateway.stageUpdate(adminCaller, {
                tx_id: txID,
                name: 'MintedTokenUpdate',
                is_last: true,
                data_free: {
                    emissions: {
                        keys: [emissionID],
                        params: ['updateEmissionsMintedToken', tokenId, partyID, emissionID],
                    },
                },
            });
        });

        it('endTx', async () => {
            await gateway.endTransitionProcess(adminCaller, txID);
        });

        it('getTxDetails', async () => {
            const tx = await gateway.getTxDetails(adminCaller, txID);
            tx.state.should.be.eq(TxState.FINISHED);
        });
    });
});

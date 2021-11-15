import chai from 'chai';
import { SHA256 } from 'crypto-js';
import { config } from 'dotenv';
import { v4 as uuid4 } from 'uuid';

import UtilityemissionchannelGateway from '../../src/blockchain-gateway/utilityEmissionsChannel';
import BCGatewayConfig from '../../src/blockchain-gateway/config';
import AWSS3 from '../../src/datasource/awsS3';
import Signer from '../../src/blockchain-gateway/signer';
import { IFabricTxCaller } from '../../src/blockchain-gateway/I-gateway';
import { setup } from '../../src/utils/logger';
import ClientError from '../../src/errors/clientError';
import { setupWebSocket } from '../setup-ws';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const should = chai.should();

setup('DEBUG', 'DEBUG');
// env
config();

const mockUtilityID = 'USA_EIA_252522444142552441242521';

describe('UtilityemissionchannelGateway', () => {
    const bcConfig = new BCGatewayConfig();
    const adminVaultToken = 'tokenId';

    describe('vault', () => {
        tests('vault');
    });
    describe('web-socket', () => {
        tests('web-socket');
    });
    function tests(caller) {
        const signer = new Signer('vault web-socket', 'inMemoryKeychain', 'plain');
        const org = bcConfig.fabricConnector();
        const utilityEmissionsGateway = new UtilityemissionchannelGateway({
            fabricConnector: org.connector,
            signer: signer,
        });
        let adminCaller: IFabricTxCaller;
        it('should setup fabric tx caller', async () => {
            switch (caller) {
                case 'web-socket':
                    const webSocketKey = await setupWebSocket('admin');
                    adminCaller = {
                        userId: 'admin',
                        webSocketKey,
                    };
                case 'vault':
                    adminCaller = {
                        userId: 'admin',
                        vaultToken: adminVaultToken,
                    };
            }
            //console.log(adminCaller)
            await org.connector.enroll(signer.fabric(adminCaller), {
                enrollmentID: 'admin',
                enrollmentSecret: 'adminpw',
                caId: org.caID,
                mspId: org.orgMSP,
            });
        });
        const mockPartyID = uuid4();
        let emissionsUUID: string;
        it('should record emissions data', async () => {
            const data = await utilityEmissionsGateway.recordEmissions(adminCaller, {
                utilityId: mockUtilityID,
                partyId: mockPartyID,
                fromDate: '2020-05-07T10:10:09Z',
                thruDate: '2021-05-07T10:10:09Z',
                energyUseAmount: 100,
                energyUseUom: 'kWh',
                url: '',
                md5: '',
            });
            emissionsUUID = data.uuid;
        });

        it('record emissions throws', async () => {
            try {
                await utilityEmissionsGateway.recordEmissions(adminCaller, {
                    utilityId: mockUtilityID,
                    partyId: mockPartyID,
                    fromDate: '2020-05-07T10:10:09Z',
                    thruDate: '2021-05-07T10:10:09Z',
                    energyUseAmount: 100,
                    energyUseUom: 'kWh',
                    url: '',
                    md5: '',
                });
                true.should.be.false;
            } catch (error) {
                (error as ClientError).status.should.be.eq(409);
            }
        });

        const mockTokenId = '0xMockToken';
        it('should update token if for minted records', async () => {
            await utilityEmissionsGateway.updateEmissionsMintedToken(adminCaller, {
                tokenId: mockTokenId,
                partyId: mockPartyID,
                uuids: [emissionsUUID],
            });
        });

        it('updateEmissionsMintedToken throws', async () => {
            try {
                await utilityEmissionsGateway.updateEmissionsMintedToken(adminCaller, {
                    tokenId: mockTokenId,
                    partyId: mockPartyID,
                    uuids: ['not-found'],
                });
                true.should.be.false;
            } catch (error) {
                (error as ClientError).status.should.be.eq(409);
            }
        });

        it('should get emissions record', async () => {
            const record = await utilityEmissionsGateway.getEmissionData(
                adminCaller,
                emissionsUUID,
            );
            record.fromDate.should.be.eq('2020-05-07T10:10:09Z');
            record.thruDate.should.be.eq('2021-05-07T10:10:09Z');
            record.tokenId.should.be.eq(mockTokenId);
        });

        it('should store the hashed partyId', async () => {
            const record = await utilityEmissionsGateway.getEmissionData(
                adminCaller,
                emissionsUUID,
            );
            const hash = SHA256(mockPartyID).toString();
            record.partyId.should.be.eq(hash);
        });

        it('getEmissionData throws', async () => {
            try {
                await utilityEmissionsGateway.getEmissionData(adminCaller, 'not-found');
                true.should.be.false;
            } catch (error) {
                (error as ClientError).status.should.be.eq(409);
            }
        });

        it('should get emissions records', async () => {
            const records = await utilityEmissionsGateway.getEmissionsRecords(adminCaller, {
                utilityId: mockUtilityID,
                partyId: mockPartyID,
            });
            records.should.have.length(1);
            records[0].uuid.should.be.eq(emissionsUUID);
        });

        it('should get emissions records by date range', async () => {
            await utilityEmissionsGateway.getAllEmissionsDataByDateRange(adminCaller, {
                fromDate: '2020-05-07T10:10:09Z',
                thruDate: '2021-05-07T10:10:09Z',
            });
        });

        it('should fail the MD5 checksum on tampering with the document', async () => {
            try {
                const mockPartyID2 = uuid4();
                const s3 = new AWSS3();
                const data = await utilityEmissionsGateway.recordEmissions(adminCaller, {
                    utilityId: mockUtilityID,
                    partyId: mockPartyID2,
                    fromDate: '2020-05-07T10:10:09Z',
                    thruDate: '2021-05-07T10:10:09Z',
                    energyUseAmount: 100,
                    energyUseUom: 'kWh',
                    url: 'localost:///tmp/filename',
                    md5: '',
                });
                const documentUrl = data.url;
                const filename = decodeURIComponent(documentUrl).split('/').slice(-1)[0];
                await s3.delete(filename);
                const testFileBuffer = Buffer.from('Testing MD5 checksum');
                await s3.upload(testFileBuffer, filename);
                await utilityEmissionsGateway.getEmissionData(adminCaller, data.uuid);
            } catch (error) {
                (error as ClientError).status.should.be.eq(409);
            }
        });

        if (caller === 'vault') {
            it('getEmissionsRecords throws', async () => {
                try {
                    await utilityEmissionsGateway.getEmissionsRecords(
                        { userId: 'not-found', vaultToken: adminVaultToken },
                        {
                            utilityId: mockUtilityID,
                            partyId: mockPartyID,
                        },
                    );
                    true.should.be.false;
                } catch (error) {
                    (error as ClientError).status.should.be.eq(409);
                }
            });

            it('getAllEmissionsDataByDateRange throws', async () => {
                try {
                    await utilityEmissionsGateway.getAllEmissionsDataByDateRange(
                        { userId: 'not-found', vaultToken: adminVaultToken },
                        {
                            fromDate: '2020-05-07T10:10:09Z',
                            thruDate: '2021-05-07T10:10:09Z',
                        },
                    );
                    true.should.be.false;
                } catch (error) {
                    (error as ClientError).status.should.be.eq(409);
                }
            });
        }
    }
});

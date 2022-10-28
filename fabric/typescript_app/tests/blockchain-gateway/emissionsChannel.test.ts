import chai from 'chai';
import chaiHttp from 'chai-http';
import { SHA256 } from 'crypto-js';
import { config } from 'dotenv';
import { v4 as uuid4 } from 'uuid';
import BCGatewayConfig from '../../src/blockchain-gateway-lib/config';
import EmissionsDataGateway from '../../src/blockchain-gateway/emissionsChannel';
import { IFabricTxCaller } from '../../src/blockchain-gateway-lib/I-gateway';
import Signer from '../../src/blockchain-gateway-lib/signer';
import AWSS3 from '../../src/datasource/awsS3';
import ClientError from '../../src/errors/clientError';
import { setup } from '../../src/utils/logger';
import { setupWebSocket } from '../setup-ws';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const should = chai.should();
chai.use(chaiHttp);

setup('DEBUG', 'DEBUG');
// env
config();

import { mockUtilityID } from '../constants';

describe('EmissionsDataGateway', () => {
    const bcConfig = new BCGatewayConfig();
    const adminVaultToken = 'tokenId';

    describe('vault', () => {
        tests('vault');
    });
    describe('web-socket', () => {
        tests('web-socket');
    });
    function tests(caller: string) {
        const signer = new Signer('vault web-socket', 'inMemoryKeychain', 'plain');
        const org = bcConfig.fabricConnector();
        const EmissionsGateway = new EmissionsDataGateway({
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
            const data = await EmissionsGateway.recordEmissions(adminCaller, {
                endpoint: 'http://oracle:3002/emissionsRecord',
                query: 'getEmissionsByUtilityLookUpItem',
                queryParams: {
                    uuid: mockUtilityID,
                    usage: 100,
                    usageUOM: 'kWh',
                    thruDate: '2021-05-07T10:10:09Z',
                },
                //utilityId: mockUtilityID,
                partyId: mockPartyID,
                fromDate: '2020-05-07T10:10:09Z',
                thruDate: '2021-05-07T10:10:09Z',
                //energyUseAmount: 100,
                //energyUseUom: 'kWh',
                url: '',
                md5: '',
            });
            emissionsUUID = data.uuid;
        });

        it('record emissions throws', async () => {
            try {
                await EmissionsGateway.recordEmissions(adminCaller, {
                    endpoint: 'http://oracle:3002/emissionsRecord',
                    query: 'getEmissionsByUtilityLookUpItem',
                    queryParams: {
                        uuid: mockUtilityID,
                        usage: 100,
                        usageUOM: 'kWh',
                        thruDate: '2021-05-07T10:10:09Z',
                    },
                    //utilityId: mockUtilityID,
                    partyId: mockPartyID,
                    fromDate: '2020-05-07T10:10:09Z',
                    thruDate: '2021-05-07T10:10:09Z',
                    //energyUseAmount: 100,
                    //energyUseUom: 'kWh',
                    url: '',
                    md5: '',
                });
                true.should.be.false;
            } catch (error) {
                (error as ClientError).status.should.be.eq(409);
            }
        });
        /*
        it('should use emissions factors for the correct year', async () => {
            const mockPartyID2 = uuid4();
            const usage = 100;
            const usage_uom_conversion = 1 / 1000;
            const emissions_uom_conversion = 1;
            const agent = chai.request.agent('http://127.0.0.1:5984');

            const emission2018 = await EmissionsGateway.recordEmissions(adminCaller, {
                utilityId: mockUtilityID,
                partyId: mockPartyID2,
                fromDate: '2018-01-01T00:00:00Z',
                thruDate: '2018-01-31T00:00:00Z',
                energyUseAmount: usage,
                energyUseUom: 'kWh',
                url: '',
                md5: '',
            });

            const emission2019 = await EmissionsGateway.recordEmissions(adminCaller, {
                utilityId: mockUtilityID,
                partyId: mockPartyID2,
                fromDate: '2019-01-01T00:00:00Z',
                thruDate: '2019-01-31T00:00:00Z',
                energyUseAmount: usage,
                energyUseUom: 'kWh',
                url: '',
                md5: '',
            });

            emission2018.emissionsAmount.should.not.eq(emission2019.emissionsAmount);

            await agent.post('/_session').set('content-type', 'application/json').send({
                name: 'admin',
                password: 'adminpw',
            });

            const emissionSelector = (year: string) => ({
                selector: {
                    class: {
                        $eq: 'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem',
                    },
                    division_id: {
                        $eq: 'WECC',
                    },
                    division_type: {
                        $eq: 'NERC_REGION',
                    },
                    year: {
                        $eq: year,
                    },
                },
                execution_stats: false,
            });

            await agent
                .post('/emissions-data_emissions/_find')
                .set('content-type', 'application/json')
                .send(emissionSelector('2018'))
                .then((response) => {
                    response.status.should.be.eq(200);
                    const data = response.body;

                    const utilityFactor = data.docs[0];

                    const emissions_value =
                        (Number(utilityFactor.co2_equivalent_emissions) /
                            Number(utilityFactor.net_generation)) *
                        usage *
                        usage_uom_conversion *
                        emissions_uom_conversion;

                    emission2018.emissionsAmount.should.be.eq(emissions_value);
                });

            await agent
                .post('/emissions-data_emissions/_find')
                .set('content-type', 'application/json')
                .send(emissionSelector('2019'))
                .then((response) => {
                    response.status.should.be.eq(200);
                    const data = response.body;

                    const utilityFactor = data.docs[0];

                    const emissions_value =
                        (Number(utilityFactor.co2_equivalent_emissions) /
                            Number(utilityFactor.net_generation)) *
                        usage *
                        usage_uom_conversion *
                        emissions_uom_conversion;

                    emission2019.emissionsAmount.should.be.eq(emissions_value);
                });
            agent.close();
        });

        it('should use emissions factors for the correct region', async () => {
            const mockUtilityID_DE = 'RWE_AG';
            const mockPartyID2 = uuid4();
            const usage = 100;
            const usage_uom_conversion = 1 / 1000;
            const agent = chai.request.agent('http://127.0.0.1:5984');

            const emissionUSA = await EmissionsGateway.recordEmissions(adminCaller, {
                utilityId: mockUtilityID,
                partyId: mockPartyID2,
                fromDate: '2019-01-01T00:00:00Z',
                thruDate: '2019-01-31T00:00:00Z',
                energyUseAmount: usage,
                energyUseUom: 'kWh',
                url: '',
                md5: '',
            });

            const emissionDE = await EmissionsGateway.recordEmissions(adminCaller, {
                utilityId: mockUtilityID_DE,
                partyId: mockPartyID2,
                fromDate: '2019-01-01T00:00:00Z',
                thruDate: '2019-01-31T00:00:00Z',
                energyUseAmount: usage,
                energyUseUom: 'kWh',
                url: '',
                md5: '',
            });

            emissionDE.emissionsAmount.should.not.eq(emissionUSA.emissionsAmount);

            await agent.post('/_session').set('content-type', 'application/json').send({
                name: 'admin',
                password: 'adminpw',
            });

            await agent
                .post('/emissions-data_emissions/_find')
                .set('content-type', 'application/json')
                .send({
                    selector: {
                        class: {
                            $eq: 'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem',
                        },
                        division_id: {
                            $eq: 'WECC',
                        },
                        division_type: {
                            $eq: 'NERC_REGION',
                        },
                        year: {
                            $eq: '2019',
                        },
                    },
                    execution_stats: false,
                })
                .then((response) => {
                    response.status.should.be.eq(200);
                    const data = response.body;
                    const utilityFactor = data.docs[0];
                    const emissions_uom_conversion = 1;

                    const emissions_value =
                        (Number(utilityFactor.co2_equivalent_emissions) /
                            Number(utilityFactor.net_generation)) *
                        usage *
                        usage_uom_conversion *
                        emissions_uom_conversion;

                    emissionUSA.emissionsAmount.should.be.eq(emissions_value);
                });

            await agent
                .post('/emissions-data_emissions/_find')
                .set('content-type', 'application/json')
                .send({
                    selector: {
                        class: {
                            $eq: 'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem',
                        },
                        division_id: {
                            $eq: 'Germany',
                        },
                        division_type: {
                            $eq: 'Country',
                        },
                        year: {
                            $eq: '2019',
                        },
                    },
                    execution_stats: false,
                })
                .then((response) => {
                    response.status.should.be.eq(200);
                    const data = response.body;
                    const utilityFactor = data.docs[0];
                    const emissions_uom_conversion = 1000;

                    const emissions_value =
                        Number(utilityFactor.co2_equivalent_emissions) *
                        usage *
                        (usage_uom_conversion / emissions_uom_conversion);

                    const percent_of_renewables = Number(utilityFactor.percent_of_renewables) / 100;

                    emissionDE.emissionsAmount.should.be.eq(emissions_value);
                    emissionDE.renewableEnergyUseAmount.should.be.eq(usage * percent_of_renewables);
                    emissionDE.nonrenewableEnergyUseAmount.should.be.eq(
                        usage * (1 - percent_of_renewables),
                    );
                });
            agent.close();
        });
*/
        const mockTokenId = '0xMockToken';
        it('should update token if for minted records', async () => {
            await EmissionsGateway.updateEmissionsMintedToken(adminCaller, {
                tokenId: mockTokenId,
                partyId: mockPartyID,
                uuids: [emissionsUUID],
            });
        });

        it('updateEmissionsMintedToken throws', async () => {
            try {
                await EmissionsGateway.updateEmissionsMintedToken(adminCaller, {
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
            const record = await EmissionsGateway.getEmissionData(adminCaller, emissionsUUID);
            record.fromDate.should.be.eq('2020-05-07T10:10:09Z');
            record.thruDate.should.be.eq('2021-05-07T10:10:09Z');
            record.tokenId.should.be.eq(mockTokenId);
        });

        it('should store the hashed partyId', async () => {
            const record = await EmissionsGateway.getEmissionData(adminCaller, emissionsUUID);
            const hash = SHA256(mockPartyID).toString();
            record.partyId.should.be.eq(hash);
        });

        it('getEmissionData throws', async () => {
            try {
                await EmissionsGateway.getEmissionData(adminCaller, 'not-found');
                true.should.be.false;
            } catch (error) {
                (error as ClientError).status.should.be.eq(409);
            }
        });

        it('should fail the MD5 checksum on tampering with the document', async () => {
            try {
                const mockPartyID2 = uuid4();
                const s3 = new AWSS3();
                const data = await EmissionsGateway.recordEmissions(adminCaller, {
                    endpoint: 'http://oracle:3002/emissionsRecord',
                    query: 'getEmissionsByUtilityLookUpItem',
                    queryParams: {
                        uuid: mockUtilityID,
                        usage: 100,
                        usageUOM: 'kWh',
                        thruDate: '2021-05-07T10:10:09Z',
                    },
                    //utilityId: mockUtilityID,
                    partyId: mockPartyID2,
                    fromDate: '2020-05-07T10:10:09Z',
                    thruDate: '2021-05-07T10:10:09Z',
                    //energyUseAmount: 100,
                    //energyUseUom: 'kWh',
                    url: 'localhost:///tmp/filename',
                    md5: '',
                });
                const documentUrl = data.url;
                const filename = decodeURIComponent(documentUrl).split('/').slice(-1)[0];
                await s3.delete(filename);
                const testFileBuffer = Buffer.from('Testing MD5 checksum');
                await s3.upload(testFileBuffer, filename);
                await EmissionsGateway.getEmissionData(adminCaller, data.uuid);
            } catch (error) {
                (error as ClientError).status.should.be.eq(409);
            }
        });
        it('should get emissions records', async () => {
            const records = await EmissionsGateway.getEmissionsRecords(adminCaller, {
                utilityId: mockUtilityID,
                partyId: mockPartyID,
            });
            records.should.have.length(1);
            records[0].uuid.should.be.eq(emissionsUUID);
        });

        it('should get emissions records by date range', async () => {
            await EmissionsGateway.getAllEmissionsDataByDateRange(adminCaller, {
                fromDate: '2020-05-07T10:10:09Z',
                thruDate: '2021-05-07T10:10:09Z',
            });
        });
        if (caller === 'vault') {
            it('getEmissionsRecords throws', async () => {
                try {
                    await EmissionsGateway.getEmissionsRecords(
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
                    await EmissionsGateway.getAllEmissionsDataByDateRange(
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

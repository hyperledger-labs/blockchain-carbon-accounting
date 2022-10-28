import chai from 'chai';
import chaiHTTP from 'chai-http';
import { v4 as uuid4 } from 'uuid';
import { WsWallet } from 'ws-wallet';
import { setupWebSocket } from './setup-ws';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const should = chai.should();
chai.use(chaiHTTP);

const v1Base = 'http://localhost:8080/api/v1/emissions-data';

const apiEndpoints = {
    newWsSessionId: '/identity/webSocket',
    registerClient: '/registerEnroll/register',
    enrollClient: '/registerEnroll/enroll',
    recordEmissions: '/emissionscontract/recordEmissions',
    // TODO add test for getEmissions
    getEmissions: '/emissionscontract/getEmissionsData',
    recordAuditedEmissionToken: '/emissionscontract/recordAuditedEmissionsToken',
    // TODO add test for getAllEmissionsData
    getAllEmissionsData: '/emissionscontract/getAllEmissionsData',
    // TODO add test for getEmissionsByDateRange
    getEmissionsByDateRange: '/emissionscontract/getAllEmissionsDataByDateRange/',
};

const adminVaultToken = 'tokenId';
const userId = 'admin';
import { mockUtilityID } from './constants';

describe('E2E-vault', () => {
    tests('vault_token', adminVaultToken);
});

describe('E2E-ws', async () => {
    // External client with private key
    const wsWalletAdmin = new WsWallet({
        keyName: uuid4(),
    });

    tests('web_socket_key', '');

    it('should create a web-socket session ID', (done) => {
        chai.request(v1Base)
            .post(apiEndpoints.newWsSessionId)
            .set('content-type', 'application/x-www-form-urlencoded')
            .set('pub_key_hex', wsWalletAdmin.getPubKeyHex())
            .query({
                userId: wsWalletAdmin.keyName,
            })
            .send({})
            .end(async (_, response) => {
                try {
                    const url = response.body.url;
                    const sessionId = response.body.sessionId;
                    const webSocketKey = await wsWalletAdmin.open(sessionId, url);
                    response.body?.sessionId?.should.be.eq(webSocketKey.sessionId);
                    response.status.should.be.eq(201);
                    done();
                } catch (error) {
                    done();
                }
            });
    });
});

function tests(headerKey: string, headerValue: string) {
    if (headerKey === 'web_socket_key') {
        let webSocketKey;
        before(async () => {
            webSocketKey = await setupWebSocket('admin');
            headerValue = JSON.stringify(webSocketKey);
        });
    }

    it('should enroll a client', (done) => {
        chai.request(v1Base)
            .post(apiEndpoints.enrollClient)
            .set('content-type', 'application/x-www-form-urlencoded')
            .set(headerKey, headerValue)
            .send({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' })
            .end(async (_, response) => {
                try {
                    response.status.should.be.eq(201);
                    done();
                } catch (error) {
                    done();
                }
            });
    });
    const clientID = uuid4();

    it('should register a client', (done) => {
        chai.request(v1Base)
            .post(apiEndpoints.registerClient)
            .set('content-type', 'application/x-www-form-urlencoded')
            .set(headerKey, headerValue)
            .query({
                userId: userId,
            })
            .send({ enrollmentID: clientID, affiliation: 'auditor1.department1' })
            .end(async (_, response) => {
                try {
                    response.status.should.be.eq(201);
                    done();
                } catch (error) {
                    done();
                }
            });
    });
    const partyId = uuid4();
    let uuid: string;
    it('should record an emission', (done) => {
        chai.request(v1Base)
            .post(apiEndpoints.recordEmissions)
            .set('content-type', 'application/x-www-form-urlencoded')
            .set(headerKey, headerValue)
            .query({
                userId: userId,
            })
            .send({
                endpoint: 'http://oracle:3002/emissionsRecord',
                query: 'getEmissionsByUtilityLookUpItem',
                utilityId: mockUtilityID,
                partyId: partyId,
                fromDate: '2020-05-07T10:10:09Z',
                thruDate: '2021-05-07T10:10:09Z',
                energyUseAmount: 100,
                energyUseUom: 'kWh',
            })
            .end(async (_, response) => {
                try {
                    response.status.should.be.eq(201);
                    const resp = response.body;
                    uuid = resp.uuid;
                    resp.utilityId.should.be.eq(mockUtilityID);
                    resp.fromDate.should.be.eq('2020-05-07T10:10:09Z');
                    resp.thruDate.should.be.eq('2021-05-07T10:10:09Z');
                    done();
                } catch (error) {
                    done();
                }
            });
    });
    it('should record audited emission token', (done) => {
        chai.request(v1Base)
            .post(apiEndpoints.recordAuditedEmissionToken)
            .set('content-type', 'application/x-www-form-urlencoded')
            .set(headerKey, headerValue)
            .set('eth_address', '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266')
            .query({
                userId: userId,
            })
            .send({
                partyId: partyId,
                addressToIssue: '0x976ea74026e726554db657fa54763abd0c3a0aa9',
                emissionsRecordsToAudit: uuid,
                txID: uuid4(),
            })
            .end(async (_, response) => {
                try {
                    response.status.should.be.eq(200);
                    done();
                } catch (error) {
                    done();
                }
            });
    });
}

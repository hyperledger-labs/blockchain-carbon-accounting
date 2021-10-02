import chai from 'chai';
import chaiHTTP from 'chai-http';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const should = chai.should();
chai.use(chaiHTTP);

import { v4 as uuid4 } from 'uuid';

const v1Base = 'http://localhost:8080/api/v1/utilityemissionchannel';

const apiEndpoints = {
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
const mockUtilityID = 'USA_EIA_252522444142552441242521';

describe('E2E-vault', () => {
    it('should enroll a client', (done) => {
        chai.request(v1Base)
            .post(apiEndpoints.enrollClient)
            .set('content-type', 'application/x-www-form-urlencoded')
            .set('vault_token', adminVaultToken)
            .send({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' })
            .end(async (error, response) => {
                try {
                    response.status.should.be.eq(201);
                    done();
                } catch (error) {
                    done();
                }
            });
    });
    const clientID = uuid4();

    it('shoudl register a client', (done) => {
        chai.request(v1Base)
            .post(apiEndpoints.registerClient)
            .set('content-type', 'application/x-www-form-urlencoded')
            .set('vault_token', adminVaultToken)
            .query({
                userId: userId,
            })
            .send({ enrollmentID: clientID, affiliation: 'auditor1.department1' })
            .end(async (error, response) => {
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
    it('should record a emissions', (done) => {
        chai.request(v1Base)
            .post(apiEndpoints.recordEmissions)
            .set('content-type', 'application/x-www-form-urlencoded')
            .set('vault_token', adminVaultToken)
            .query({
                userId: userId,
            })
            .send({
                utilityId: mockUtilityID,
                partyId: partyId,
                fromDate: '2020-05-07T10:10:09Z',
                thruDate: '2021-05-07T10:10:09Z',
                energyUseAmount: 100,
                energyUseUom: 'kWh',
            })
            .end(async (error, response) => {
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
            .set('vault_token', adminVaultToken)
            .set('eth_address', '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266')
            .query({
                userId: userId,
            })
            .send({
                partyId: partyId,
                addressToIssue: '0x976ea74026e726554db657fa54763abd0c3a0aa9',
                emissionsRecordsToAudit: uuid,
            })
            .end(async (error, response) => {
                try {
                    response.status.should.be.eq(200);
                    done();
                } catch (error) {
                    done();
                }
            });
    });
});

import { 
  issue_emissions_request,
  syncWalletRoles,
  OPTS_TYPE 
} from '@blockchain-carbon-accounting/api-server';
import type { ActivityEmissionsFactorLookup } from '@blockchain-carbon-accounting/data-postgres/src/models/activityEmissionsFactorLookup';
import { PostgresDBService } from '@blockchain-carbon-accounting/data-postgres/src/postgresDbService';
import type { EmissionsFactorInterface } from '@blockchain-carbon-accounting/emissions_data_lib/src/emissionsFactor';
import { generateKeyPair, hash_content } from '@blockchain-carbon-accounting/supply-chain-lib/src/crypto-utils';
import { get_gclient } from '@blockchain-carbon-accounting/supply-chain-lib/src/distance-utils';
import type { GroupedResult, GroupedResults } from '@blockchain-carbon-accounting/supply-chain-lib/src/emissions-utils';
import { group_processed_activities, process_activities, process_emissions_requests, queue_issue_tokens } from '@blockchain-carbon-accounting/supply-chain-lib/src/emissions-utils';
import { downloadFileRSAEncrypted, downloadFileWalletEncrypted, uploadFileRSAEncrypted, uploadFileWalletEncrypted } from '@blockchain-carbon-accounting/supply-chain-lib/src/ipfs-utils';
import { get_ups_client } from '@blockchain-carbon-accounting/supply-chain-lib/src/ups-utils';
import { assert, expect } from 'chai';
import { Contract } from 'ethers';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { deployments, ethers, getNamedAccounts, network, run } from "hardhat";
import { TASK_NODE_CREATE_SERVER } from "hardhat/builtin-tasks/task-names";
import Ctl from 'ipfsd-ctl';
import sinon from 'sinon';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';
import findConfig from "find-config";
config({ path: findConfig(".env.TEST") || '.' });

function cleanup() {
  if (existsSync('tests-private.pem')) unlinkSync('tests-private.pem');
  if (existsSync('tests-public.pem')) unlinkSync('tests-public.pem');
  if (existsSync('test-wallet-priv.key')) unlinkSync('test-wallet-priv.key')
}

const OPTS: OPTS_TYPE = {
  contract_address: '',
  tracker_address: '',
  network_name: 'hardhat',
  network_rpc_url: 'http://localhost:8545'
}

const factor_fields = {
  scope: 'Scope 3',
  type: 'SCOPE_3_EMISSIONS',
  class:'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem',
  co2_equivalent_emissions: '10',
  co2_equivalent_emissions_uom: 'kg',
};

// hardhat instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let server: any;

const TEST_WALLET_PRIVATE_KEY = '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const TEST_WALLET_ENC_PUB_KEY = 'mgn9uRllOGtnBcc07TbDJlFElnuCPiOhtmWui+kiaDw=';

async function addTestEmissionsFactor(efl: EmissionsFactorInterface) {
  const db = await PostgresDBService.getInstance();
  await db.getEmissionsFactorRepo().putEmissionFactor({...efl});
}
async function addTestEmissionsFactorAndLookup(efl: ActivityEmissionsFactorLookup) {
  const db = await PostgresDBService.getInstance();
  await db.getActivityEmissionsFactorLookupRepo().putActivityEmissionsFactorLookup(efl);
  await db.getEmissionsFactorRepo().putEmissionFactor({...efl, ...factor_fields, uuid: uuidv4()});
}


async function setupDBSeed() {
  await addTestEmissionsFactorAndLookup({
    mode:'flight',
    type:'economy',
    scope:'Scope 3',
    level_1:'Business travel- air',
    level_2:'Flights',
    level_3:'INTERNATIONAL, TO/FROM NON-UK',
    level_4:'ECONOMY CLASS',
    text:'With RF',
    activity_uom:'passenger.km'
  });
  await addTestEmissionsFactorAndLookup({
    mode:'flight',
    type:'business',
    scope:'Scope 3',
    level_1:'Business travel- air',
    level_2:'Flights',
    level_3:'INTERNATIONAL, TO/FROM NON-UK',
    level_4:'BUSINESS CLASS',
    text:'With RF',
    activity_uom:'passenger.km'
  });
  await addTestEmissionsFactorAndLookup({
    mode:'carrier',
    type:'ground',
    scope:'Scope 3',
    level_1:'Freighting good',
    level_2:'Vans',
    level_3:'',
    level_4:'',
    text:'',
    activity_uom:'tonne.km'
  });
  await addTestEmissionsFactor({
    ...factor_fields,
    level_1: 'BUSINESS TRAVEL- SEA',
    level_2: 'FERRY',
    level_3: 'FOOT PASSENGER',
    activity_uom:'passenger.km',
    uuid: uuidv4()
  });
}


let geoCount = 1;

describe("Emissions and Tokens requests test", function() {
  before(async function() {
    cleanup();
    // create a test connection instance
    const db = await PostgresDBService.getInstance({
      dbName: 'blockchain-carbon-accounting-test',
      dbUser: process.env.POSTGRES_USER || '',
      dbPassword: process.env.POSTGRES_PASSWORD || '',
      dbHost: process.env.POSTGRES_HOST || 'localhost',
      dbPort: 5432,
      dbVerbose: false,
    });
    // clean DB state
    await db.getConnection().synchronize(true);
    // add some factors needed for the test
    await setupDBSeed();

    // run the JSON RPC server
    server = await run(TASK_NODE_CREATE_SERVER, {
      hostname: "localhost",
      port: 8545,
      provider: network.provider,
    });

    // stub the google apis
    const gclient = get_gclient();
    sinon.stub(gclient, 'distancematrix').resolves({
      data:{
        rows: [
          {
            elements: [
              {
                distance: {
                  text: '123 km',
                  value: 123000
                },
                // eslint-disable-next-line
                // @ts-ignore
                status: 'OK'
              }
            ]
          }
        ]
      }
    });
    // eslint-disable-next-line
    // @ts-ignore
    sinon.stub(gclient, 'geocode').callsFake((args: any)=>{ //eslint-disable-line @typescript-eslint/no-explicit-any
      const { lat, lng } = args?.params?.address?.indexOf('Paris') > -1 ?
        { lat: 48.856, lng: 2.352 } :
        { lat: 1*(geoCount++), lng: 2*(geoCount++) };
      console.log('*** fake geocode', lat, lng);

      return Promise.resolve({
        data:{
          results: [
            {
              geometry: {
                location: {
                  lat,
                  lng,
                }
              }
            }
          ]
        }
      });
    });
    const ups = get_ups_client();
    sinon.stub(ups, 'track').callsFake((_trackingNumber,_opts,cb)=>{
      console.log('**** fake ups track ****');
      cb(null, {
        Response:{
          ResponseStatusCode: '1',
          ResponseStatusCodeDescription: 'Success',
        },
        Shipment: {
          Shipper:{
            Address:{
              AddressLine1: 'test',
              City: 'test',
              PostalCode: 'test',
              CountryCode: 'test'
            },
            ShipperNumber: 'test'
          },
          ShipTo:{
            Address:{
              AddressLine1: 'test',
              City: 'test',
              PostalCode: 'test',
              CountryCode: 'test'
            }
          }, ShipmentWeight: {
            UnitOfMeasurement: {
              Code: 'KGS'
            },
            Weight: 1
          },
          Service: {
            Code: '03',
            Description: 'Ground'
          },
          Package: {
            Activity: [
              {
                Status: {
                  StatusType: {
                    Code: 'OR',
                    Description: 'Origin'
                  },
                  StatusCode: {
                    Code: 'OR',
                  }
                },
                ActivityLocation: {
                  Address: {
                    AddressLine1: 'test',
                    City: 'test',
                    PostalCode: 'test',
                    CountryCode: 'test'
                  },
                  Code: '01',
                  Description: 'Origin'
                },
                Date: '2019-01-01',
                Time: '00:00:00',
              },
              {
                Status: {
                  StatusType: {
                    Code: 'D',
                    Description: 'Destination'
                  },
                  StatusCode: {
                    Code: 'D',
                  }
                },
                ActivityLocation: {
                  Address: {
                    AddressLine1: 'test',
                    City: 'test',
                    PostalCode: 'test',
                    CountryCode: 'test'
                  },
                  Code: '02',
                  Description: 'Destination'
                },
                Date: '2019-01-01',
                Time: '00:00:00',

              }
            ]
          }
        }
      });
    });

    await server.listen()
  });

  after(async function () {
    sinon.restore();
    cleanup();
    // close hardhat instance
    await server.close();
    // close DB connection instance
    const db = await PostgresDBService.getInstance();
    db.close();
  });

  let contract: Contract;
  beforeEach(async () => {
    await deployments.fixture();
    // this is needed because of a weird bug in the hardhat plugin not registering in TS
    // eslint-disable-next-line
    // @ts-ignore
    contract = (await ethers.getContract('NetEmissionsTokenNetwork')) as Contract;
    // set the contract address
    OPTS.contract_address = contract.address;
    // OPTS.contract = contract;
  });

  it("should allow an emissions request to be processed", async function() {
    // start ipfs
    const ipfsd = await Ctl.createController({
      ipfsHttpModule: require('ipfs-http-client'),
      ipfsBin: require('go-ipfs').path()
    })
    const id = await ipfsd.api.id()

    console.log('IPFS started', id);

    // Generate 2 public/private key pairs
    generateKeyPair('tests');
    // the second wallet will use a metamask type key
    const wallet_private_key_file = 'test-wallet-priv.key';
    writeFileSync(wallet_private_key_file, TEST_WALLET_PRIVATE_KEY);
    // check they exist
    const rsa_private_key_file = 'tests-private.pem';
    const rsa_public_key_file = 'tests-public.pem';
    expect(existsSync(rsa_private_key_file)).to.be.true;
    expect(existsSync(rsa_public_key_file)).to.be.true;
    expect(existsSync(wallet_private_key_file)).to.be.true;

    const public_key = readFileSync(rsa_public_key_file).toString();
    const private_key = readFileSync(rsa_private_key_file).toString();
    expect(public_key).to.be.a('string').and.not.empty;
    expect(private_key).to.be.a('string').and.not.empty;

    // check we can upload and download encrypted content to IPFS using RSA keys
    const test_content = JSON.stringify({foo: "bar", content: "test content"});
    const uploaded = await uploadFileRSAEncrypted(test_content, [public_key], true);
    const downloaded = await downloadFileRSAEncrypted(uploaded.ipfs_path, rsa_private_key_file);
    expect(downloaded?.toString()).to.equal(test_content);

    // check we can upload and download encrypted content to IPFS using metamask keys
    const uploaded2 = await uploadFileWalletEncrypted(test_content, [TEST_WALLET_ENC_PUB_KEY], true);
    const downloaded2 = await downloadFileWalletEncrypted(uploaded2.ipfs_path, wallet_private_key_file);
    expect(downloaded2?.toString()).to.equal(test_content);

    // Store the public keys for the 2 default auditors in hardhat, not the demo ones.
    const { consumer1, dealer2: auditor1, dealer4: auditor2 } = await getNamedAccounts();
    // register them as auditors
    await contract.registerDealer(auditor1, 3);
    await contract.registerDealer(auditor2, 3);
    const db = await PostgresDBService.getInstance();

    await db.getWalletRepo().clearWalletsRoles();
    console.log('Checking account auditor1 ', auditor1);
    await syncWalletRoles(auditor1, OPTS, {
      name: 'Auditor 1',
      organization: 'Hardhat Test',
      public_key_name: 'metamask',
      public_key,
      metamask_encrypted_public_key: TEST_WALLET_ENC_PUB_KEY
    });
    console.log('Checking account auditor2 ', auditor2);
    await syncWalletRoles(auditor2, OPTS, {
      name: 'Auditor 2',
      organization: 'Hardhat Test',
      public_key_name: 'test',
      public_key
    });

    // Generate emissions audit requests from the input.json file. We can add a TEST mode so that the code will
    //  automatically return a fixed emissions for the shipments and flights, instead of requiring Google and UPS
    //  API's in the tests. Just hard code the actual numbers for input.json into the TEST mode.
    const data_raw = readFileSync('../app/supply-chain/input.json', 'utf8');
    const data = JSON.parse(data_raw);
    // make suer we got activities
    expect(data).to.have.property('activities');

    const process_result = await process_activities(data.activities);
    // should be an array with 9 elements
    expect(process_result).to.be.an('array');
    expect(process_result).to.have.lengthOf(9);
    // only two should have errors
    for (const a of process_result) {
      const activity = a.activity;
      if (activity.id === '4') {
        expect(a.error).to.exist;
      } else {
        expect(a.error).to.not.exist;
      }
    }
    expect(process_result.filter(x => x.error)).to.have.lengthOf(1);

    const grouped_by_type = await group_processed_activities(process_result);
    // check the result has groups for each input activity type
    expect(grouped_by_type).to.have.property('shipment');
    expect(grouped_by_type).to.have.property('flight');
    expect(grouped_by_type).to.have.property('emissions_factor');
    // queue the audit requests, they will be issued from auditor1 and issued to consumer1
    for (const t in grouped_by_type) {
      if (t === 'shipment') {
        const group = grouped_by_type[t] as GroupedResults;
        for (const mode in group) {
          const issue_group = group[mode] as GroupedResults;
          for (const issued_from in issue_group) {
            const doc = issue_group[issued_from] as GroupedResult;
            const token_res = await queue_issue_tokens(doc, t, mode, undefined, consumer1);
            expect(token_res).to.have.property('tokenId').that.is.a('string').equal('queued');
          }
        }
      } else {
        const issue_group = grouped_by_type[t] as GroupedResults;
        for (const issued_from in issue_group) {
          const doc = issue_group[issued_from] as GroupedResult;
          const token_res = await queue_issue_tokens(doc, t, undefined, undefined, consumer1);
          expect(token_res).to.have.property('tokenId').that.is.a('string').equal('queued');
        }
      }
    }
    // DB should have 3 audit requests (one per processed group)
    let audit_requests = await db.getEmissionsRequestRepo().selectAll();
    expect(audit_requests).to.have.lengthOf(3);
    // they should all have a status of CREATED
    expect(audit_requests.filter(x => x.status === 'CREATED')).to.have.lengthOf(3);

    // Process the requests.
    await process_emissions_requests();
    // they now should be PENDING
    audit_requests = await db.getEmissionsRequestRepo().selectAll();
    expect(audit_requests).to.have.lengthOf(3);
    expect(audit_requests.filter(x => x.status === 'PENDING')).to.have.lengthOf(3);

    // Issue the tokens from the auditors
    // Note: this just marks them issued
    // Verify the tokens quantities are correct
    for (const request of audit_requests) {
      await issue_emissions_request(request.uuid);
      const token_amount = request.token_total_emissions;
      // check the request is assigned to an auditor, either auditor1 or auditor2
      const auditor = request.emission_auditor;
      expect(auditor).to.be.a('string').that.is.not.empty;
      expect(auditor).to.be.oneOf([auditor1, auditor2]);
      // just to make TS infer not undefined
      if (!auditor) throw new Error('empty auditor');
      const metadata = request.token_metadata;
      expect(metadata).to.be.a('string').that.is.not.empty;
      // just to make TS infer not undefined
      if (!metadata) throw new Error('empty metadata');
      const json = JSON.parse(metadata);
      expect(json).to.have.property('Total emissions').that.is.a('number');
      expect(json["Total emissions"]).to.equal(Number(token_amount)/1000);
      const manifest = request.token_manifest;
      expect(manifest).to.be.a('string').that.is.not.empty;
      // just to make TS infer not undefined
      if (!manifest) throw new Error('empty metadata');
      const json_manifest = JSON.parse(manifest);
      expect(json_manifest).to.have.property('Public Key').that.is.a('string').that.is.not.empty;
      expect(json_manifest).to.have.property('Location').that.is.a('string').that.is.not.empty;
      expect(json_manifest).to.have.property('SHA256').that.is.a('string').that.is.not.empty;
      const location = json_manifest['Location'] as string;
      const sha256 = json_manifest['SHA256'] as string;
      const public_key = json_manifest['Public Key'] as string;
      // Get the files and decrypt with the private keys
      // Verify the files have the correct sha256
      expect(location).to.be.a('string').and.match(/^ipfs:\/\//);
      const filename = location.substring(7);
      const decrypt = async (auditor: string, filename: string) => {
        if (auditor === auditor1) {
          expect(public_key).to.equal('metamask');
          return await downloadFileWalletEncrypted(filename, wallet_private_key_file);
        } else if (auditor === auditor2) {
          expect(public_key).to.equal('test');
          return await downloadFileRSAEncrypted(filename, rsa_private_key_file);
        } else {
          assert.fail('unknown auditor');
        }
      }
      // decrypt depends on the wallet address of the auditor
      const content = await decrypt(auditor, filename);
      // content should not be null
      expect(content).to.not.be.null;
      if (!content) throw new Error('Could not decrypt file? did not get content!');
      const h = hash_content(content);
      expect(h.value).to.equal(sha256);
    }

    console.log('All Done.');
  })
});

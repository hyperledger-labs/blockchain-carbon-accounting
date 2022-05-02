import { generateKeyPair } from '../../supply-chain/lib/src/crypto-utils';
import { syncWalletRoles } from '../api-server/controller/synchronizer';
import { PostgresDBService } from '../../data/postgres/src/postgresDbService';
import { existsSync, unlinkSync, readFileSync } from 'fs';
import { expect } from 'chai';
import sinon from 'sinon';
import { run, network, getNamedAccounts, deployments, ethers } from "hardhat";
import { TASK_NODE_CREATE_SERVER } from "hardhat/builtin-tasks/task-names";
import { OPTS_TYPE } from '../api-server/server';
import { Contract } from 'ethers';
import { group_processed_activities, process_activities } from '../api-server/node_modules/supply-chain-lib/src/emissions-utils';
import { get_gclient } from '../api-server/node_modules/supply-chain-lib/src/distance-utils';
import { get_ups_client } from '../api-server/node_modules/supply-chain-lib/src/ups-utils';
import { v4 as uuidv4 } from 'uuid';
import { ActivityEmissionsFactorLookup } from '../api-server/node_modules/blockchain-accounting-data-postgres/src/models/activityEmissionsFactorLookup';
import { EmissionsFactorInterface } from '../../supply-chain/node_modules/emissions_data_chaincode/src/lib/emissionsFactor';

function cleanup() {
  if (existsSync('tests-private.pem')) unlinkSync('tests-private.pem');
  if (existsSync('tests-public.pem')) unlinkSync('tests-public.pem');
}

const OPTS: OPTS_TYPE = {
  contract_address: '',
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

async function addTestEmissionsFactor(efl: EmissionsFactorInterface) {
  const db = await PostgresDBService.getInstance();
  await db.getEmissionsFactorRepo().putEmissionFactor({...efl});
}
async function addTestEmissionsFactorAndLookup(efl: ActivityEmissionsFactorLookup) {
  const db = await PostgresDBService.getInstance();
  await db.getActivityEmissionsFactorLookupRepo().putActivityEmissionsFactorLookup(efl);
  await db.getEmissionsFactorRepo().putEmissionFactor({...efl, ...factor_fields, uuid: uuidv4()});
}


let geoCount = 1;

describe("Emissions and Tokens requests test", function() {
  before(async function() {
    cleanup();
    // create a test connection instance
    const db = await PostgresDBService.getInstance({
      dbName: 'blockchain-carbon-accounting-test',
      dbUser: '', 
      dbPassword: '',
      dbHost: 'localhost',
      dbPort: 5432,
      dbVerbose: false,
    });
    // clean DB state
    await db.getConnection().synchronize(true);
    // add some factors needed for the test
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

    // run the JSON RPC server
    // run("node");
    const server = await run(TASK_NODE_CREATE_SERVER, {
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
                status: 'OK'
              }
            ]
          }
        ]
      }
    });
    sinon.stub(gclient, 'geocode').callsFake((args: any)=>{
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
    console.log('beforeEach: contract?', contract.address);
  });

  it("should allow an emissions request to be processed", async function() {
    // Generate 2 public/private key pairs
    generateKeyPair('tests');
    // check they exist
    expect(existsSync('tests-private.pem')).to.be.true;
    expect(existsSync('tests-public.pem')).to.be.true;

    const public_key = readFileSync('tests-public.pem').toString();

    // Store the public keys for the 2 default auditors in hardhat, not the demo ones.
    const { dealer2: auditor1, dealer4: auditor2 } = await getNamedAccounts();
    const db = await PostgresDBService.getInstance();

    await db.getWalletRepo().clearWalletsRoles();
    console.log('Checking account auditor1 ', auditor1);
    await syncWalletRoles(auditor1, OPTS, {
      name: 'Auditor 1', 
      organization: 'Hardhat Test', 
      public_key_name: 'test', 
      public_key
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
    const data_raw = readFileSync('../supply-chain/input.json', 'utf8');
    const data = JSON.parse(data_raw);
    // make suer we got activities
    expect(data).to.have.property('activities');

    const process_result = await process_activities(data.activities);
    console.log('process_result', process_result);
    // should be an array with 9 elements
    expect(process_result).to.be.an('array');
    // expect(process_result).to.have.lengthOf(9);
    // only two should have errors
    for (const a of process_result) {
      const activity = a.activity;
      if (activity.id === '2' || activity.id === '4') {
        expect(a.error).to.exist;
      } else {
        console.log(a.error)
        expect(a.error).to.not.exist;
      }
    }
    // expect(process_result.filter(x => x.error)).to.have.lengthOf(2);

    const grouped_by_type = group_processed_activities(process_result);
    console.log('grouped_by_type', grouped_by_type);


    // Process the requests.
    // Issue the tokens from the auditors
    // Verify the tokens are issued in the right units
    // Get the files and decrypt with the private keys
    // Verify the files have the correct sha256
    console.log('test');
  })
});

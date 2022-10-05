import { 
  runSync 
} from '@blockchain-carbon-accounting/api-server';
import type { 
  OPTS_TYPE 
} from '@blockchain-carbon-accounting/api-server';
import { PostgresDBService } from '@blockchain-carbon-accounting/data-postgres/src/postgresDbService';
import { expect } from 'chai';
import superjson from 'superjson';
import { Contract } from 'ethers';
import { deployments, ethers, getNamedAccounts, network, run } from "hardhat";
import { TASK_NODE_CREATE_SERVER } from "hardhat/builtin-tasks/task-names";
import request from 'supertest';

const OPTS: OPTS_TYPE = {
  contract_address: '',
  tracker_address: '',
  network_name: 'hardhat',
  network_rpc_url: 'http://localhost:8545'
}

const MAX256 = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;

// hardhat instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let server: any;

describe("BigInt tests", function() {
  before(async function() {
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

    // run the JSON RPC server
    server = await run(TASK_NODE_CREATE_SERVER, {
      hostname: "localhost",
      port: 8545,
      provider: network.provider,
    });
    await server.listen()
  });

  after(async function () {
    // close hardhat instance
    await server.close();
    // close DB connection instance
    const db = await PostgresDBService.getInstance();
    await db.close();
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
  });

  let trackerContract: Contract;
  beforeEach(async () => {
    await deployments.fixture();
    // this is needed because of a weird bug in the hardhat plugin not registering in TS
    // eslint-disable-next-line
    // @ts-ignore
    trackerContract = (await ethers.getContract('CarbonTracker')) as Contract;
    // set the contract address
    OPTS.tracker_address = trackerContract.address;
  });

  it("should sync the correct amounts in DB", async function() {

    // Store the public keys for the 2 default auditors in hardhat, not the demo ones.
    const { consumer1, dealer2: auditor1, dealer4: auditor2 } = await getNamedAccounts();
    await contract.registerDealer(auditor1, 3);
    await contract.registerDealer(auditor2, 3);
    const registerConsumer = await contract
      .connect(await ethers.getSigner(auditor1))
      .registerConsumer(consumer1);
    expect(registerConsumer);

    const db = await PostgresDBService.getInstance();

    const issue = await contract
      .connect(await ethers.getSigner(auditor1))
      .issue(
        0,
        consumer1,
        3,
        MAX256,
        "1607463809",
        "1607463909",
        "metaData",
        "manifest",
        "description"
      );
    expect(issue);

    // sync the DB, this inserts the token and balance
    await runSync(0, OPTS);

    // check the token was recorded in the DB
    const tokenCount = await db.getTokenRepo().countTokens([]);
    expect(tokenCount).to.equal(1);

    const token = await db.getTokenRepo().selectToken(1);
    expect(token);
    console.log('Found token:', token)
    if (!token) throw new Error('No token');
    expect(token.tokenId).to.equal(1);
    expect(token.totalIssued);
    expect(token.totalIssued).to.equal(MAX256);
    expect(token.totalRetired).to.equal(MAX256);


    // check the balance was recorded properly
    const balance = await db.getBalanceRepo().selectBalance(token.issuedTo, token.tokenId);
    expect(balance);
    console.log('Found balance:', balance)
    if (!balance) throw new Error('No balance');
    expect(balance.available).to.equal(0n);
    expect(balance.transferred).to.equal(0n);
    expect(balance.retired).to.equal(MAX256);

  })

  it("should get the correct amounts from the /tokens API", async function() {
    // check we get the correct types through the API server
    console.log('Starting server ...');
    const { default: server } = await import('@blockchain-carbon-accounting/api-server/server');
    // try to call the /ip API
    await request(server)
      .get('/ip')
      .expect(200);
    console.log('Server is running ...');

    // get the token through the API
    const tokensResp = await request(server).get('/tokens');
    console.log('Got tokens:', tokensResp.body);
    expect(tokensResp.status).to.equal(200);
    const b = tokensResp.body;
    expect(b.status).to.equal('success');
    expect(b.tokens).to.be.an('array');
    expect(b.tokens.length).to.equal(1);
    const t = b.tokens[0];
    expect(t.tokenId).to.equal(1);
    expect(t.totalIssued).to.equal(MAX256.toString());
    expect(t.totalRetired).to.equal(MAX256.toString());
  })

  it("should get the correct amounts from the TRPC tokens.lookup API", async function() {
    // check we get the correct types through the API server
    console.log('Starting server ...');
    const { default: server } = await import('@blockchain-carbon-accounting/api-server/server');
    // try to call the /ip API
    const ip_req = request(server).get('/ip');
    const res = await ip_req;
    expect(res.status).to.equal(200);
    console.log('Server is running ...');

    const input = {}
    const trpc_res = await request(server).get(`/trpc/balance.list?batch=1&input=${JSON.stringify(input)}`);
    expect(trpc_res.status).to.equal(200);
    console.log('Got trpc response:', trpc_res.text);
    const j = trpc_res.body[0].result.data;
    const { json, meta } = j;
    const d = superjson.deserialize({ json, meta }) as any;
    console.log('JSON response:', d);
    expect(d.status).to.equal('success');
    expect(d.count).to.equal(1);
    expect(d.balances).to.be.an('array');
    // those bigints serialized to strings
    console.log('JSON response balance:', d.balances[0]);
    console.log('JSON response token:', d.balances[0]?.token);
    expect(d.balances[0].transferred).to.equal(0n);
    expect(d.balances[0].retired).to.equal(MAX256);
    expect(d.balances[0].token.totalIssued).to.equal(MAX256);
    expect(d.balances[0].token.totalRetired).to.equal(MAX256);
  })
});


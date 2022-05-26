import { expect } from 'chai';
import { PostgresDBService } from "../src/postgresDbService";

describe("Wallet tests", function() {

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
    // add a test wallet
    await db.getWalletRepo().insertWallet({address: '0x12345Test', name: 'test wallet'})
  });

  after(async function () {
    // close DB connection instance
    const db = await PostgresDBService.getInstance();
    db.close();
  });

  it("should merge the given properties only", async function() {
    const db = await PostgresDBService.getInstance()

    {
      const w = await db.getWalletRepo().findWalletByAddress('0x12345test')
      expect(w?.address).to.equal('0x12345Test')
      expect(w?.name).to.equal('test wallet')
    }

    {
      const w = await db.getWalletRepo().mergeWallet({ address: '0x12345TEST', roles: 'role1,role2' })
      expect(w?.address).to.equal('0x12345Test')
      expect(w?.name).to.equal('test wallet')
      expect(w?.roles).to.equal('role1,role2')
    }

    {
      const w = await db.getWalletRepo().mergeWallet({ address: '0x12345TEST', roles: undefined, name: undefined })
      expect(w?.address).to.equal('0x12345Test')
      expect(w?.name).to.equal('test wallet')
      expect(w?.roles).to.equal('role1,role2')
    }
  });

  it("should merge an empty role array", async function() {
    const db = await PostgresDBService.getInstance()

    {
      const w = await db.getWalletRepo().mergeWallet({ address: '0x12345TEST', roles: 'role1,role2' })
      expect(w?.address).to.equal('0x12345Test')
      expect(w?.name).to.equal('test wallet')
      expect(w?.roles).to.equal('role1,role2')
    }

    {
      const w = await db.getWalletRepo().mergeWallet({ address: '0x12345TEST', name: 'test edit' })
      expect(w?.address).to.equal('0x12345Test')
      expect(w?.name).to.equal('test edit')
    }

    {
      const w = await db.getWalletRepo().mergeWallet({ address: '0x12345TEST', roles: '' })
      expect(w?.address).to.equal('0x12345Test')
      expect(w?.name).to.equal('test edit')
      expect(w?.roles).to.equal('')
    }

  });


});

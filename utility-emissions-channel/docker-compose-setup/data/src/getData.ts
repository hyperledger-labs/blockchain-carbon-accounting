import { create } from 'ipfs-http-client';
import * as OrbitDB from 'orbit-db';
const DB_NAME = 'org.hyperledger.blockchain-carbon-accounting';
let db;

// const UTILITY_EMISSIONS_FACTOR_CLASS_IDENTIFER =
//     'org.hyperledger.blockchain-carbon-accounting.utilityemissionsfactoritem';
// const UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER =
//     'org.hyperledger.blockchain-carbon-accounting.utilitylookuplist';

(async () => {
    const ipfs = await create();
    const orbitdb = await OrbitDB.createInstance(ipfs);
    const dbOptions = {
        // Give write access to the creator of the database
        accessController: {
            type: 'orbitdb', //OrbitDBAccessController
            write: [orbitdb.identity.id],
        },
        indexBy: 'uuid',
    };

    db = await orbitdb.docstore(DB_NAME, dbOptions);
    await db.load();
    console.log(`OrbitDB address: ${db.address.toString()}`);

    // Listen for updates from peers
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    db.events.on('replicated', (_) => {
        console.log(db.iterator({ limit: -1 }).collect());
    });

    console.log(await db.get(''));
    return;
})();

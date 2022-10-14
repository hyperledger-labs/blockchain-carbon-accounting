import { PostgresDBService } from "./postgresDbService"
import { encryptField } from "./repositories/common"
import { config } from 'dotenv';
import findConfig from "find-config";
config({ path: findConfig(".env") || '.' });

async function getDBInstance() {
  return await PostgresDBService.getInstance();
}

export async function process_wallets() {
  const db = await getDBInstance();

  const wallets = await db.getWalletRepo().selectAll();

  for (const w in wallets) {
    const wallet = wallets[w]
    if (wallet.email) {
       console.log(wallet.address);
       console.log(wallet.email);
       console.log(wallet.name);
       const wl = await db.getWalletRepo().findWalletByEmail(wallet.email, true);
       if (wl) {
         if (wl.private_key) {
            if (!wl.private_key.includes('#')) {
              console.log(wl.private_key);
              const encrypted = encryptField(wl.private_key);
              console.log(encrypted);
              if (encrypted) {
                await db.getWalletRepo().updatePrivateKey(wallet.address, encrypted);
                console.log('Updated.');
              } else {
                console.error('Encrypted key is empty.');
              }
            } else {
              console.log('Already encrypted.');
            }
         } else {
           console.log('Empty private key.');
         }
       } else {
          console.error('Cannot get wallet by email.');
       }
       console.log('-----------------------------------------------');
    }
  }
}

process_wallets();

import { Wallet, Wallets } from "fabric-network";
import path from "path";
import fs from "fs";

async function createWallet() {
  const wallet: Wallet = await Wallets.newFileSystemWallet("wallet");

  const credPath: string = path.resolve(
    __dirname,
    "../../../../docker-compose-setup/organizations/peerOrganizations/auditor1.carbonAccounting.com/users/User1@auditor1.carbonAccounting.com/msp"
  );
  const cert: string = fs.readFileSync(path.join(credPath, "signcerts/cert.pem")).toString();
  const key: string = fs.readFileSync(path.join(credPath, "keystore/priv_sk")).toString();

  const identityLabel: string = "User1@auditor1.carbonAccounting.com";
  const identity = {
    credentials: {
      certificate: cert,
      privateKey: key,
    },
    mspId: "auditor1",
    type: "X.509",
  };

  await wallet.put(identityLabel, identity);
  console.log("++++++++++++++ Wallet created +++++++++++++++");
}
createWallet();

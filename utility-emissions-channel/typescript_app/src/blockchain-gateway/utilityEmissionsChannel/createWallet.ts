import { Wallet, Wallets } from "fabric-network";
import path from "path";
import fs from "fs";

import { WALET_IDENTITY_LABEL, PATH_TO_MSP } from "../../config/config";

async function createWallet() {
  const wallet: Wallet = await Wallets.newFileSystemWallet("wallet");

  const credPath: string = path.resolve(
    __dirname,
    PATH_TO_MSP
  );
  const cert: string = fs.readFileSync(path.join(credPath, "signcerts/cert.pem")).toString();
  const key: string = fs.readFileSync(path.join(credPath, "keystore/priv_sk")).toString();

  const identity = {
    credentials: {
      certificate: cert,
      privateKey: key,
    },
    mspId: "auditor1",
    type: "X.509",
  };

  await wallet.put(WALET_IDENTITY_LABEL, identity);
  console.log("++++++++++++++ Wallet created +++++++++++++++");
}
createWallet();

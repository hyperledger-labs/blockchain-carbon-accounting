const { Gateway, Wallets } = require("fabric-network");
const path = require("path");
const fs = require('fs');

async function createWallet() {
  const wallet = await Wallets.newFileSystemWallet("wallet");

  const credPath = path.resolve(__dirname, "../../../../docker-compose-setup/organizations/peerOrganizations/auditor1.carbonAccounting.com/users/User1@auditor1.carbonAccounting.com/msp");
  const cert = fs.readFileSync(path.join(credPath, "signcerts/cert.pem")).toString();
  const key = fs.readFileSync(path.join(credPath, "keystore/priv_sk")).toString();

  const identityLabel = "User1@auditor1.carbonAccounting.com";
  const identity = {
    credentials: {
      certificate: cert,
      privateKey: key,
    },
    mspId: 'auditor1',
    type: "X.509",
  };

  await wallet.put(identityLabel, identity);
  console.log("++++++++++++++ Wallet created +++++++++++++++")
}
createWallet();

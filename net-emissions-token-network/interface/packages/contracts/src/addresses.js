// SPDX-License-Identifier: Apache-2.0
// This file stores the contract address the interface will attempt to connect to
// By default, these addresses are all set to the addresses returned by running the command:
// npx hardhat run --network localhost scripts/deploy-all.js

const addresses = {

  network: "Hardhat Network",
  // network: "Optimism Local",

  tokenNetwork: {
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // default Hardhat Network deployment address with scripts/deploy-all.js
    // address: "0xa94ec9484BfC9aB8d3fD80eB2735f132d257a135", // default ovm_localhost deployment address with scripts/deploy-all.js
  },

  // governance contracts
  dao: {
    governor: {
      address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" // default Hardhat Network deployment address with scripts/deploy-all.js
      // address: "0x251b0aEbbe9D3e5281a699f45517D80Dd938eDa0", // default ovm_localhost deployment address with scripts/deploy-all.js
    },
    daoToken: {
      address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" // default Hardhat Network deployment address with scripts/deploy-all.js
      // address: "0xD4B82BDB1Abb1c1506173722c7d51FFCA659124f", // default ovm_localhost deployment address with scripts/deploy-all.js
    }
  }
};

export default addresses;

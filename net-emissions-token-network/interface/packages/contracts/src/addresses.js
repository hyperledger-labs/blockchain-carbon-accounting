// SPDX-License-Identifier: Apache-2.0
// This file stores the contract address the interface will attempt to connect to
// By default, these addresses are all set to the addresses returned by running the command:
// npx hardhat run --network localhost scripts/deploy-all.js

const addresses = {

  network: "Hardhat Network",

  tokenNetwork: {
    address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // default Hardhat deployment address with scripts/deploy-all.js
  },

  // governance contracts
  dao: {
    governor: {
      address: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707" // default Hardhat deployment address with scripts/deploy-all.js
    },
    daoToken: {
      address: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9" // default Hardhat deployment address with scripts/deploy-all.js
    }
  }
};

export default addresses;

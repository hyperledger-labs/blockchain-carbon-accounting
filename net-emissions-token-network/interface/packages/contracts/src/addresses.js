// SPDX-License-Identifier: Apache-2.0
// This file stores the contract address the interface will attempt to connect to

const networksAndAddresses = {

  hardhat: {
    network: "Hardhat Network",
    tokenNetwork: {
      address: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // default Hardhat Network deployment address with scripts/deploy-all.js
    },
    dao: {
      governor: {
        address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" // default Hardhat Network deployment address with scripts/deploy-all.js
      },
      daoToken: {
        address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" // default Hardhat Network deployment address with scripts/deploy-all.js
      }
    }
  },

  optimism_integration: {
    network: "Optimism Local",
    tokenNetwork: {
      address: "0xa94ec9484BfC9aB8d3fD80eB2735f132d257a135", // default ovm_localhost deployment address with scripts/deploy-all.js
    },
    dao: {
      governor: {
        address: "0x251b0aEbbe9D3e5281a699f45517D80Dd938eDa0", // default ovm_localhost deployment address with scripts/deploy-all.js
      },
      daoToken: {
        address: "0xD4B82BDB1Abb1c1506173722c7d51FFCA659124f", // default ovm_localhost deployment address with scripts/deploy-all.js
      }
    }
  },

  arbitrum_kovan: {
    network: "Arbitrum Kovan",
    tokenNetwork: {
      address: "0x0D4F2bbE6d6A035769A97C72BD8bBeBE2338C500" // deployed 2021-03-25 on arbitrum kovan v4
    },
    dao: {
      governor: {
        address: "0x630192Cc43eA176B7b52995e3Cd1594eaCbaa454", // deployed 2021-03-25 on arbitrum kovan v4
      },
      daoToken: {
        address: "0xDf7691809610f808Ea311909Fb404197971b1f9D", // deployed 2021-03-25 on arbitrum kovan v4
      }
    }
  },

}

const addresses = networksAndAddresses.hardhat;

export default addresses;

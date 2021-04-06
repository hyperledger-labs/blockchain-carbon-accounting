// SPDX-License-Identifier: Apache-2.0
// This file stores the contract address the interface will attempt to connect to

const networksAndAddresses = {

  hardhat: {
    network: "Hardhat Network",
    tokenNetwork: {
      address: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788", // default Hardhat Network deployment address with npx hardhat node
    },
    dao: {
      governor: {
        address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // default Hardhat Network deployment address with npx hardhat node
      },
      daoToken: {
        address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // default Hardhat Network deployment address with npx hardhat node
      }
    }
  },

  optimism_integration: {
    network: "Optimism Local",
    tokenNetwork: {
      address: "0xa94ec9484BfC9aB8d3fD80eB2735f132d257a135", // npx hardhat deploy --network ovm_localhost
    },
    dao: {
      governor: {
        address: "0x251b0aEbbe9D3e5281a699f45517D80Dd938eDa0", // npx hardhat deploy --network ovm_localhost
      },
      daoToken: {
        address: "0xD4B82BDB1Abb1c1506173722c7d51FFCA659124f", // npx hardhat deploy --network ovm_localhost
      }
    }
  },

  arbitrum_kovan: {
    network: "Arbitrum Kovan",
    tokenNetwork: {
      address: "0x0D4F2bbE6d6A035769A97C72BD8bBeBE2338C500", // deployed 2021-03-25 on arbitrum kovan v4
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

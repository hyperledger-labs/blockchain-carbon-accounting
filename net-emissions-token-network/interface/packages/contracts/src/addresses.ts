// SPDX-License-Identifier: Apache-2.0
// This file stores the contract address the interface will attempt to connect to

const networksAndAddresses = {

  hardhat: {
    network: "Hardhat Network",
    tokenNetwork: {
      address: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788", // default Hardhat Network deployment address with npx hardhat node
    },
    carbonTracker: {
      address: "0x0dcd1bf9a1b36ce34237eeafef220932846bcd82", // default Hardhat Network deployment address with npx hardhat node
    },
    dao: {
      governor: {
        address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // default Hardhat Network deployment address with npx hardhat node
      },
      daoToken: {
        address: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // default Hardhat Network deployment address with npx hardhat node
      }
    }
  },

  goerli: {
    network: "Goerli Testnet",
    tokenNetwork: {
      address: "0x45Cd99F9C3b657D092c5BA81C8c39C99a81DA4C4",   
    },
    dao: {
      governor: {
        address: "0x9F4590684d1DD950dF65Dc71D39f782bc3af317A", 
      },
      daoToken: {
        address: "0x67E5b82809f28aA321818b90bF5c603D954f87C8", 
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

  xdai: {
    network: "xDai",
    tokenNetwork: {
      address: "0xf7B361Fe2dE41Cd092D2c777D2136CB8E3C2B146", // deployed 2021-04-06
    },
    dao: {
      governor: {
        address: "0x7137EB87725D61d69e6543E7b498bC4780AF1608", // deployed 2021-04-06
      },
      daoToken: {
        address: "0xe0E06767718e04A51c99C3A1cfc63a42950616a1", // deployed 2021-04-06
      }
    }
  },

  ropsten: {
    network: "Ropsten",
    tokenNetwork: {
      address: "0xDf582cE97A933f6987b19838985874E4434207A2", // deployed 2021-04-06
    },
    dao: {
      governor: {
        address: "0x6E21205682C80E6BD2d292561BA8b736186132ED", // deployed 2021-04-29
      },
      daoToken: {
        address: "0xD32E793008B0FbD13C889E291bc049483Da316bA", // deployed 2021-04-29
      }
    }
  },

  bsctestnet: {
    network: "Binance Testnet",
    tokenNetwork: {
      address: "0xE513F642D8A2f266c61e95C75A7DaB922faB2E7C", // deployed 2022-04-22
    },
    carbonTracker: {
      address: "0x5018c5a5779611b23100eA8a86fdDDD54f805B3C", // deployed 2022-04-22
    },
    dao: {
      governor: {
        address: "0x698843A281847b41d064FB71576995Ce3A6ab7Dc", // deployed 2022-04-22
      },
      daoToken: {
        address: "0x1AB72EC128921dE4F7f119b14b17797940BD984d", // deployed 2022-04-22
      }
    }
  },
}

// change this to the network you want
const addresses = networksAndAddresses.hardhat;

export default addresses;

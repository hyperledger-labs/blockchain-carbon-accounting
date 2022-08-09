// SPDX-License-Identifier: Apache-2.0
// This file stores the contract address the interface will attempt to connect to

const networksAndAddresses = {

  hardhat: {
    network: "Hardhat Network",
    tokenNetwork: {
      address: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6", // default Hardhat Network deployment address with npx hardhat node
    },
    carbonTracker: {
      address: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0", // default Hardhat Network deployment address with npx hardhat node
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
      address: "0x4FB55d1D6Aab976d527dD5C9700d73b20f155A07", // deployed 2022-05-04
    },
    carbonTracker: {
      address: "0x00fb3250af0eA88ba9279E3bBa7dF5b6Af6E6573", // deployed 2022-05-04
    },
    dao: {
      governor: {
        address: "0xeb6b1516471b49f508DBE0d989dC5147e96942a4", // deployed 2022-05-04
      },
      daoToken: {
        address: "0x0f3e1c1E898576C2515d07580284d3caDACFBb5f", // deployed 2022-05-04
      }
    }
  },

  avalanchetestnet: {
    network: "Avalanche Testnet",
    tokenNetwork: {
      address: "0x91883251A8964dDB40F07Bc55298284a07431d1d", // deployed 2022-07-07
    },
    carbonTracker: {
      address: "",
    },
    dao: {
      governor: {
        address: "0xBEc5DE921587403faf0b83A9779e3F30d6109199", // deployed 2022-07-07
      },
      daoToken: {
        address: "0x64197Ed54e8C63F99D5d2A9b2b3007BCA55376A3", // deployed 2022-07-07
      }
    }
  },
}

// change this to the network you want
const addresses = networksAndAddresses.hardhat;

export default addresses;

// SPDX-License-Identifier: Apache-2.0
require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');

// Make sure to run `npx hardhat clean` before recompiling and testing
if (process.env.OVM) {
  require("@eth-optimism/plugins/hardhat/compiler");
  require("@eth-optimism/plugins/hardhat/ethers");
}

// Uncomment and populate .ethereum-config.js if deploying contract to Goerli, Kovan, xDai, or verifying with Etherscan
// const ethereumConfig = require("./.ethereum-config");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {

    compilers: [

      // NetEmissionsTokenNetwork
      {
        version: "0.7.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },

      // DAO
      {
        version: "0.5.16"
      }
    ]

    
  },
  gasReporter: {
    currency: 'USD',
  },
  networks: {
    hardhat: {
      chainId: 1337
    },

    ovm_localhost: {
      url: `http://localhost:9545`
    },

    // Uncomment the following lines if deploying contract to Goerli or running Etherscan verification
    // Deploy with npx hardhat run --network goerli scripts/deploy.js
    // goerli: {
    //   url: `https://goerli.infura.io/v3/${ethereumConfig.INFURA_PROJECT_ID}`,
    //   accounts: [`0x${ethereumConfig.CONTRACT_OWNER_PRIVATE_KEY}`]
    // },

    // Uncomment the following lines if deploying contract to xDai
    // Deploy with npx hardhat run --network xdai scripts/deploy.js
    // xdai: {
    //   url: "https://xdai.poanetwork.dev",
    //   chainId: 100,
    //   accounts: [`0x${ethereumConfig.CONTRACT_OWNER_PRIVATE_KEY}`]
    // }

    // Uncomment the following lines if deploying contract to Kovan
    // Deploy with npx hardhat run --network kovan scripts/deploy.js
    // kovan: {
    //   url: `https://kovan.infura.io/v3/${ethereumConfig.INFURA_PROJECT_ID}`,
    //   accounts: [`0x${ethereumConfig.CONTRACT_OWNER_PRIVATE_KEY}`]
    // }

  },
  // Uncomment if running contract verification
  // etherscan: {
  //   apiKey: `${ethereumConfig.ETHERSCAN_API_KEY}`
  // },
  ovm: {
    solcVersion: '0.7.6'
  }
};

// SPDX-License-Identifier: Apache-2.0
require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require('hardhat-deploy');
require('hardhat-deploy-ethers');
require('@openzeppelin/hardhat-upgrades');

// Make sure to run `npx hardhat clean` before recompiling and testing
if (process.env.OVM) {
  require("@eth-optimism/plugins/hardhat/compiler");
  require("@eth-optimism/plugins/hardhat/ethers");
}

// Uncomment and populate .ethereum-config.js if deploying contract to Goerli, Kovan, xDai, or verifying with Etherscan
// const ethereumConfig = require("./.ethereum-config");


// Task to destroy a NetEmissionsTokenNetwork contract
task("destroyClm8Contract", "Destroy a NetEmissionsTokenNetwork contract")
  .addParam("contract", "The CLM8 contract to destroy")
  .setAction(async taskArgs => {
    const [admin] = await ethers.getSigners();
    const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
    const contract = await NetEmissionsTokenNetwork.attach(taskArgs.contract);
    await contract.connect(admin).selfDestruct();
  })

// Task to set limited mode on NetEmissionsTokenNetwork
task("setLimitedMode", "Set limited mode on a NetEmissionsTokenNetwork contract")
  .addParam("value", "True or false to set limited mode")
  .addParam("contract", "The CLM8 contract")
  .setAction(async taskArgs => {
    const [admin] = await ethers.getSigners();
    const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
    const contract = await NetEmissionsTokenNetwork.attach(taskArgs.contract);
    await contract.connect(admin).setLimitedMode( (taskArgs.value) == "true" ? true : false );
  })

// Task to upgrade NetEmissionsTokenNetwork contract
task("upgradeClm8Contract", "Upgrade a specified CLM8 contract to a newly deployed contract")
  .setAction(async taskArgs => {
    const {deployer} = await getNamedAccounts();

    const {deploy, get} = deployments;

    // output current implementation address
    current = await get("NetEmissionsTokenNetwork");
    console.log("Current NetEmissionsTokenNetwork (to be overwritten):", current.implementation);

    // deploy V2
    let netEmissionsTokenNetwork = await deploy('NetEmissionsTokenNetwork', {
      from: deployer,
      proxy: {
        owner: deployer,
        proxyContract: "OptimizedTransparentProxy",
      },
      contract: "NetEmissionsTokenNetworkV2",
      args: [ deployer ],
    });

    // output new implementation address
    console.log("New NetEmissionsTokenNetwork implementation deployed to:", netEmissionsTokenNetwork.implementation);
    console.log(`The same address ${netEmissionsTokenNetwork.address} can be used to interact with the contract.`);
  });

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {

  namedAccounts: {
    deployer: { default: 0 },
    dealer1: { default: 1 },
    dealer2: { default: 2 },
    dealer3: { default: 3 },
    dealer4: { default: 4 },
    consumer1: { default: 5 },
    consumer2: { default: 6 },
    unregistered: { default: 7 }
  },

  solidity: {

    compilers: [
      {
        version: "0.7.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
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

    // Uncomment the following lines if deploying contract to Optimism on Kovan
    // Deploy with npx hardhat run --network optimism_kovan scripts/___.js
    // optimism_kovan: {
    //   url: `https://kovan.optimism.io/`,
    //   accounts: [`0x${ethereumConfig.CONTRACT_OWNER_PRIVATE_KEY}`]
    // },

    // Uncomment the following lines if deploying contract to Arbitrum on Kovan
    // Deploy with npx hardhat run --network arbitrum_kovan scripts/___.js
    // arbitrum_kovan: {
    //   url: `https://kovan4.arbitrum.io/rpc`,
    //   accounts: [`0x${ethereumConfig.CONTRACT_OWNER_PRIVATE_KEY}`]
    // },

    // Uncomment the following lines if deploying contract to Goerli or running Etherscan verification
    // Deploy with npx hardhat run --network goerli scripts/___.js
    // goerli: {
    //   url: `https://goerli.infura.io/v3/${ethereumConfig.INFURA_PROJECT_ID}`,
    //   accounts: [`0x${ethereumConfig.CONTRACT_OWNER_PRIVATE_KEY}`]
    // },

    // Uncomment the following lines if deploying contract to xDai
    // Deploy with npx hardhat run --network xdai scripts/___.js
    // xdai: {
    //   url: "https://xdai.poanetwork.dev",
    //   chainId: 100,
    //   accounts: [`0x${ethereumConfig.CONTRACT_OWNER_PRIVATE_KEY}`]
    // }

    // Uncomment the following lines if deploying contract to Kovan
    // Deploy with npx hardhat run --network kovan scripts/___.js
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

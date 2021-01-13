require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");

// Uncomment and populate .goerli-config.js with keys if deploying contract to Goerli
// const goerliConfig = require("./.goerli-config");

// Uncomment and populate .etherscan-config.js with Etherscan key for contract verification
// const etherscanConfig = require("./.etherscan-config");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.7.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  gasReporter: {
    currency: 'USD',
  },
  networks: {
    // Uncomment the following lines if deploying contract to Goerli or running Etherscan verification
    // Deploy with npx hardhat run --network goerli scripts/deploy.js
    // goerli: {
    //   url: `https://goerli.infura.io/v3/${goerliConfig.INFURA_PROJECT_ID}`,
    //   accounts: [`0x${goerliConfig.GOERLI_CONTRACT_OWNER_PRIVATE_KEY}`]
    // },
    hardhat: {
      chainId: 1337
    }
  },
  etherscan: {
    // Uncomment if running contract verification
    // apiKey: `${etherscanConfig.ETHERSCAN_API_KEY}`
  }
};

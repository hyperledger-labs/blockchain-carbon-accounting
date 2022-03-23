// SPDX-License-Identifier: Apache-2.0
require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require('hardhat-deploy');
require('hardhat-deploy-ethers');
require('@openzeppelin/hardhat-upgrades');
require("@ethersproject/bignumber");

// Make sure to run `npx hardhat clean` before recompiling and testing
if (process.env.OVM) {
  require("@eth-optimism/plugins/hardhat/compiler");
  require("@eth-optimism/plugins/hardhat/ethers");
}

let encodeParameters = function (types, values) {
  let abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
};

// Uncomment and populate .ethereum-config.js if deploying contract to Goerli, Kovan, xDai, or verifying with Etherscan
// const ethereumConfig = require("./.ethereum-config");

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

// Task to set quorum on Governor
task("setQuorum", "Set the quorum value on a Governor contract")
  .addParam("value", "The new quorum value in votes")
  .addParam("contract", "The Governor contract")
  .setAction(async taskArgs => {
    const [admin] = await ethers.getSigners();
    const Governor = await hre.ethers.getContractFactory("Governor");
    const contract = await Governor.attach(taskArgs.contract);
    // since the dCLM8 token has 18 decimals places and the sqrt function cuts this in half, so 9 zeros must be padded on the value in order to get the correct order of magnitude.
    await contract.connect(admin).setQuorum( ethers.BigNumber.from(taskArgs.value).mul(ethers.BigNumber.from("1000000000")));
  })

// Task to set proposal threshold on Governor
task("setProposalThreshold", "Set the proposal threshold on a Governor contract")
  .addParam("value", "The minimum amount of dCLM8 required to lock with a proposal")
  .addParam("contract", "The Governor contract")
  .setAction(async taskArgs => {
    const [admin] = await ethers.getSigners();
    const Governor = await hre.ethers.getContractFactory("Governor");
    const contract = await Governor.attach(taskArgs.contract);
    await contract.connect(admin).setProposalThreshold( String(taskArgs.value) );
  })

task("getQuorum", "Return the quorum value (minimum number of votes for a proposal to pass)")
  .addParam("contract", "The Governor contract")
  .setAction(async taskArgs => {
    const [admin] = await ethers.getSigners();
    const Governor = await hre.ethers.getContractFactory("Governor");
    const contract = await Governor.attach(taskArgs.contract);
    let quorum = (await contract.connect(admin).quorumVotes()).toString();
    console.log(ethers.BigNumber.from(quorum).div(ethers.BigNumber.from("1000000000")).toString());
  })
task("getProposalThreshold", "Return the proposal threshold (amount of dCLM8 required to stake with a proposal)")
  .addParam("contract", "The Governor contract")
  .setAction(async taskArgs => {
    const [admin] = await ethers.getSigners();
    const Governor = await hre.ethers.getContractFactory("Governor");
    const contract = await Governor.attach(taskArgs.contract);
    console.log((await contract.connect(admin).proposalThreshold()).toString());
  })
task("setTestAccountRoles", "Set default account roles for testing")
  .addParam("contract", "The CLM8 contract")
  .setAction(async taskArgs => {
    const {dealer1, dealer2, dealer3, consumer1, consumer2, industry1, industry2} = await getNamedAccounts();

    const [admin] = await ethers.getSigners();
    const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
    const contract = await NetEmissionsTokenNetwork.attach(taskArgs.contract);

    await contract.connect(admin).registerDealer(dealer1, 1); // REC dealer
    console.log("Account " + dealer1 + " is now a REC dealer");
    await contract.connect(admin).registerDealer(dealer2, 3); // emissions auditor
    console.log("Account " + dealer2 + " is now an emissions auditor");
    await contract.connect(admin).registerDealer(dealer3, 2); // offsets dealer
    console.log("Account " + dealer3 + " is now an offsets  dealer");

    await contract.connect(admin).registerDealer(industry1,4);
    console.log("Account " + industry1 + " is now an industry")
    // self registered industry dealer
    await contract.connect(await ethers.getSigner(industry1)).registerIndustry(industry2);
    console.log("Account " + industry2 + " is now an industry")

    await contract.connect(await ethers.getSigner(industry1)).registerConsumer(consumer1);
    console.log("Account " + consumer1 + " is now a consumer");
    await contract.connect(admin).registerConsumer(consumer2);
    console.log("Account " + consumer2 + " is now a consumer");
  });
task("createTestProposal", "Create a test proposal using the default account roles for testing")
  .addParam("governor", "The Governor contract")
  .addParam("contract", "The CLM8 contract")
  .setAction(async (taskArgs) => {
    const { dealer1, dealer2 } = await getNamedAccounts();

    const [admin] = await ethers.getSigners();
    const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
    const contract = await NetEmissionsTokenNetwork.attach(taskArgs.contract);
    const Governor = await hre.ethers.getContractFactory("Governor");
    const govContract = await Governor.attach(taskArgs.governor);

    let calldatas = [
      encodeParameters(
        // types of params
        ["address","address","uint8","uint256","uint256","uint256","uint256","string","string","string",],
        // value of params
        [
          dealer2, // account
          dealer1, // proposer
          1, // tokenTypeId
          50, // qty
          0, // fromDate
          0, // thruDate
          0, // automaticRetireDate
          "some metadata",
          "a manifest",
          "some action inside a test proposal",
        ]
      ),
    ];

    await govContract.connect(admin).propose(
      [contract.address], // targets
      [0], // values
      ["issueOnBehalf(address,address,uint8,uint256,uint256,uint256,uint256,string,string,string)",], // signatures
      calldatas,
      "a test proposal"
    );
  });
task("createTestMultiProposal", "Create a test multi proposal using the default account roles for testing")
  .addParam("governor", "The Governor contract")
  .addParam("contract", "The CLM8 contract")
  .addOptionalParam("children", "The number of children to add, defaults to 3", 3, types.int)
  .setAction(async (taskArgs) => {
    const { dealer1, dealer2 } = await getNamedAccounts();

    const [admin] = await ethers.getSigners();
    const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
    const contract = await NetEmissionsTokenNetwork.attach(taskArgs.contract);
    const Governor = await hre.ethers.getContractFactory("Governor");
    const govContract = await Governor.attach(taskArgs.governor);

    let calldatas = [
      encodeParameters(
        // types of params
        ["address","address","uint8","uint256","uint256","uint256","uint256","string","string","string",],
        // value of params
        [
          dealer2, // account
          dealer1, // proposer
          1, // tokenTypeId
          50, // qty
          0, // fromDate
          0, // thruDate
          0, // automaticRetireDate
          "some metadata",
          "a manifest",
          "some action inside a test proposal",
        ]
      ),
    ];

    let targets = [contract.address];
    let values = [0];
    let signatures = [
      "issueOnBehalf(address,address,uint8,uint256,uint256,uint256,uint256,string,string,string)",
    ];
    let descriptions = ["a test proposal"];
    for (let i = 0; i < taskArgs.children; i++) {
      // except for the description, it doesn't really matter what we put here since child proposals are never executed
      targets.push("0x0000000000000000000000000000000000000000");
      values.push(0);
      signatures.push("");
      calldatas.push("0x");
      descriptions.push("A test child proposal " + i);
    }

    await govContract.connect(admin).proposeMultiAttribute(
      targets, // targets
      values, // values
      signatures, // signatures
      calldatas,
      descriptions
    );
  });
task("giveDaoTokens", "Give DAO tokens to default account roles for testing")
  .addParam("contract", "The dCLM8 token")
  .setAction(async taskArgs => {
    const {dealer1, dealer2, dealer3, consumer1, consumer2} = await getNamedAccounts();

    const [admin] = await ethers.getSigners();
    const daoToken = await hre.ethers.getContractFactory("DAOToken");
    const contract = await daoToken.attach(taskArgs.contract);

    let decimals = ethers.BigNumber.from("1000000000000000000");
    let tokens = ethers.BigNumber.from("500000");
    let i = tokens.mul(decimals);

    await contract.connect(admin).transfer(dealer1, i);
    console.log (`Gave ${tokens} DAO Tokens to ${dealer1}`);
    await contract.connect(admin).transfer(dealer2, i);
    console.log (`Gave ${tokens} DAO Tokens to ${dealer2}`);
    await contract.connect(admin).transfer(dealer3, i);
    console.log (`Gave ${tokens} DAO Tokens to ${dealer3}`);
    await contract.connect(admin).transfer(consumer1, i);
    console.log (`Gave ${tokens} DAO Tokens to ${consumer1}`);
    await contract.connect(admin).transfer(consumer2, i);
    console.log (`Gave ${tokens} DAO Tokens to ${consumer2}`);
})
task("showDaoTokenBalances", "Show the DAO tokens balances of the test users")
  .addParam("contract", "The dCLM8 token")
  .setAction(async taskArgs => {
    const {deployer, dealer1, dealer2, dealer3, consumer1, consumer2} = await getNamedAccounts();

    const [admin] = await ethers.getSigners();
    const daoToken = await hre.ethers.getContractFactory("DAOToken");
    const contract = await daoToken.attach(taskArgs.contract);

    console.log("DAO dCLM8 balances:");
    console.log(` deployer  ${await contract.connect(admin).balanceOf(deployer)}`);
    console.log(` dealer1   ${await contract.connect(admin).balanceOf(dealer1)}`);
    console.log(` dealer2   ${await contract.connect(admin).balanceOf(dealer2)}`);
    console.log(` dealer3   ${await contract.connect(admin).balanceOf(dealer3)}`);
    console.log(` consumer1 ${await contract.connect(admin).balanceOf(consumer1)}`);
    console.log(` consumer2 ${await contract.connect(admin).balanceOf(consumer2)}`);
})
task("getTotalSupply", "Get the total supply of DAO tokens")
  .addParam("contract", "The dCLM8 token")
  .setAction(async (taskArgs) => {
    const [admin] = await ethers.getSigners();
    const daoToken = await hre.ethers.getContractFactory("DAOToken");
    const contract = await daoToken.attach(taskArgs.contract);

    let supply = await contract.connect(admin).getTotalSupply();
    console.log("Total supply is (dCLM8): " + supply);
  });
task("addToSupply", "Add a given amount to the total supply of DAO tokens")
  .addParam("contract", "The dCLM8 token")
  .addParam("amount", "The number of dCLM8 token to add")
  .setAction(async (taskArgs) => {
    if (!taskArgs.amount || taskArgs.amount == "0") {
      console.log("Please specify the amount to add.");
      return;
    }

    const [admin] = await ethers.getSigners();
    const daoToken = await hre.ethers.getContractFactory("DAOToken");
    const contract = await daoToken.attach(taskArgs.contract);
    console.log(`Adding ${taskArgs.amount} to the Total supply`);
    await contract.connect(admin).addToTotalSupply(taskArgs.amount.toString());

    let supply = await contract.connect(admin).getTotalSupply();
    console.log("Total supply is (dCLM8): " + supply);
  });

// Task to upgrade NetEmissionsTokenNetwork contract
task("upgradeClm8Contract", "Upgrade a specified CLM8 contract to a newly deployed contract")
  .setAction(async taskArgs => {
    const {deployer} = await getNamedAccounts();

    const {deploy, get} = deployments;

    // output current implementation address
    let current = await get("NetEmissionsTokenNetwork");
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

task("completeTimelockAdminSwitch", "Complete a Timelock admin switch for a live DAO contract")
  .addParam("timelock", "")
  .addParam("governor", "")
  .addParam("target", "")
  .addParam("value", "")
  .addParam("signature", "")
  .addParam("data", "")
  .addParam("eta", "")
  .setAction(async taskArgs => {
    const {get} = deployments;

    const Timelock = await hre.ethers.getContractFactory("Timelock");
    const timelock = await Timelock.attach(taskArgs.timelock);
    const Governor = await hre.ethers.getContractFactory("Governor");
    const governor = await Governor.attach(taskArgs.governor);

    await timelock.executeTransaction(
      taskArgs.target,
      taskArgs.value,
      taskArgs.signature,
      taskArgs.data,
      taskArgs.eta
    );
    console.log("Executed setPendingAdmin() on Timelock.");

    await governor.__acceptAdmin();
    console.log("Called __acceptAdmin() on Governor.");

    console.log("Done performing Timelock admin switch.");
  });

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {

  namedAccounts: {
    // these are based on the accounts you see when run $ npx hardhat node --show-acounts
    deployer: { default: 0 },
    dealer1: { default: 1 },
    dealer2: { default: 2 },
    dealer3: { default: 3 },
    dealer4: { default: 4 },
    consumer1: { default: 19 },
    consumer2: { default: 18 },
    industry1: { default: 15 },
    industry2: { default: 16 },
    unregistered: { default: 7 }
  },

  solidity: {

    compilers: [
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.8.3",
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

    // bsctestnet: {
    //   url: "https://data-seed-prebsc-1-s1.binance.org:8545",
    //   chainId: 97,
    //   gasPrice: 20000000000,
    //   accounts: [`0x${ethereumConfig.BSC_PRIVATE_KEY}`]
    // }

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

    // Uncomment the following lines if deploying contract to Ropsten - See https://infura.io/docs/ethereum#section/Choose-a-Network
    // Deploy with npx hardhat run --network ropsten scripts/___.js
    // ropsten: {
    //   url: `https://ropsten.infura.io/v3/${ethereumConfig.INFURA_PROJECT_ID}`,
    //   accounts: [`0x${ethereumConfig.CONTRACT_OWNER_PRIVATE_KEY}`]
    // },

  },
  // Uncomment if running contract verification
  // etherscan: {
  //   apiKey: `${ethereumConfig.ETHERSCAN_API_KEY}`
  // },
  ovm: {
    solcVersion: '0.7.6'
  }
};

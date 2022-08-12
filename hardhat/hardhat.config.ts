// SPDX-License-Identifier: Apache-2.0
import { task, types } from "hardhat/config";
import { AbiCoder } from "ethers/lib/utils";

import "@nomiclabs/hardhat-waffle";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "@openzeppelin/hardhat-upgrades";
import "@ethersproject/bignumber";

// Make sure to run `npx hardhat clean` before recompiling and testing
if (process.env.OVM) {
  import("@eth-optimism/plugins/hardhat/compiler");
  // TODO: not found ..
  // import("@eth-optimism/plugins/hardhat/ethers");
}

// eslint-disable-next-line
const encodeParameters = function (abi: AbiCoder, types: string[], values: any[]) {
  // const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
};

// Uncomment and populate .ethereum-config.js if deploying contract to Goerli, Kovan, xDai, or verifying with Etherscan
//const ethereumConfig = require("./.ethereum-config");

// Task to set limited mode on NetEmissionsTokenNetwork
task("setLimitedMode", "Set limited mode on a NetEmissionsTokenNetwork contract")
  .addParam("value", "True or false to set limited mode")
  .addParam("contract", "The CLM8 contract")
  .setAction(async (taskArgs, hre) => {
    const [admin] = await hre.ethers.getSigners();
    const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
    const contract = NetEmissionsTokenNetwork.attach(taskArgs.contract);
    await contract.connect(admin).setLimitedMode( (taskArgs.value) == "true" ? true : false );
  })

// Task to set quorum on Governor
task("setQuorum", "Set the quorum value on a Governor contract")
  .addParam("value", "The new quorum value in votes")
  .addParam("contract", "The Governor contract")
  .setAction(async (taskArgs, hre) => {
    const [admin] = await hre.ethers.getSigners();
    const Governor = await hre.ethers.getContractFactory("Governor");
    const contract = Governor.attach(taskArgs.contract);
    // since the dCLM8 token has 18 decimals places and the sqrt function cuts this in half, so 9 zeros must be padded on the value in order to get the correct order of magnitude.
    await contract.connect(admin).setQuorum(hre.ethers.BigNumber.from(taskArgs.value).mul(hre.ethers.BigNumber.from("1000000000")));
  })

// Task to set proposal threshold on Governor
task("setProposalThreshold", "Set the proposal threshold on a Governor contract")
  .addParam("value", "The minimum amount of dCLM8 required to lock with a proposal")
  .addParam("contract", "The Governor contract")
  .setAction(async (taskArgs, hre) => {
    const [admin] = await hre.ethers.getSigners();
    const Governor = await hre.ethers.getContractFactory("Governor");
    const contract = Governor.attach(taskArgs.contract);
    await contract.connect(admin).setProposalThreshold( String(taskArgs.value) );
  })

task("getQuorum", "Return the quorum value (minimum number of votes for a proposal to pass)")
  .addParam("contract", "The Governor contract")
  .setAction(async (taskArgs, hre) => {
    const [admin] = await hre.ethers.getSigners();
    const Governor = await hre.ethers.getContractFactory("Governor");
    const contract = Governor.attach(taskArgs.contract);
    const quorum = (await contract.connect(admin).quorumVotes()).toString();
    console.log(hre.ethers.BigNumber.from(quorum).div(hre.ethers.BigNumber.from("1000000000")).toString());
  })
task("getProposalThreshold", "Return the proposal threshold (amount of dCLM8 required to stake with a proposal)")
  .addParam("contract", "The Governor contract")
  .setAction(async (taskArgs, hre) => {
    const [admin] = await hre.ethers.getSigners();
    const Governor = await hre.ethers.getContractFactory("Governor");
    const contract = Governor.attach(taskArgs.contract);
    console.log((await contract.connect(admin).proposalThreshold()).toString());
  })
task("setTestAccountRoles", "Set default account roles for testing")
  .addParam("contract", "The CLM8 contract")
  .setAction(async (taskArgs, hre) => {
    const {dealer1, dealer2, dealer3, consumer1, consumer2, industry1, industry2, industry3, industry4, industry5, industry6, investor1, dealer4, dealer5, dealer6, dealer7, ups, airfrance} = await hre.getNamedAccounts();

    const [admin] = await hre.ethers.getSigners();
    const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
    const contract = await NetEmissionsTokenNetwork.attach(taskArgs.contract);
    
    const {get} = hre.deployments;
    let carbonTracker = await get("CarbonTracker");
    
    await contract.connect(admin).registerDealer(carbonTracker.address, 4); // REC dealer
    console.log("Account " + carbonTracker.address + " set as industry dealer");
    await contract.connect(admin).registerDealer(dealer1, 1); // REC dealer
    console.log("Account " + dealer1 + " is now a REC dealer");
    await contract.connect(admin).registerDealer(dealer2, 3); // emissions auditor
    console.log("Account " + dealer2 + " is now an emissions auditor");
    await contract.connect(admin).registerDealer(dealer4, 3); // emissions auditor
    console.log("Account " + dealer4 + " is now an emissions auditor");
    await contract.connect(admin).registerDealer(dealer5, 3); // emissions auditor
    console.log("Account " + dealer5 + " is now an emissions auditor");
    await contract.connect(admin).registerDealer(dealer6, 3); // emissions auditor
    console.log("Account " + dealer6 + " is now an emissions auditor");
    await contract.connect(admin).registerDealer(dealer7, 2); // offsets dealer
    console.log("Account " + dealer7 + " is now an offsets  dealer");

    await contract.connect(admin).registerIndustry(industry1);
    console.log("Account " + industry1 + " is now an industry")
    // self registered industry dealer
    await contract.connect(admin).registerIndustry(industry2);
    console.log("Account " + industry2 + " is now an industry")
    await contract.connect(admin).registerIndustry(industry3);
    console.log("Account " + industry3 + " is now an industry")
    await contract.connect(admin).registerIndustry(industry4);
    console.log("Account " + industry4 + " is now an industry")
    await contract.connect(admin).registerIndustry(industry5);
    console.log("Account " + industry5 + " is now an industry")
    await contract.connect(admin).registerIndustry(industry6);
    console.log("Account " + industry6 + " is now an industry")

    await contract.connect(admin).registerConsumer(investor1);
    console.log("Account " + investor1 + " is now an consumer (investor)")


    await contract.connect(await hre.ethers.getSigner(dealer1)).registerConsumer(consumer1);
    console.log("Account " + consumer1 + " is now a consumer");
    await contract.connect(admin).registerConsumer(consumer2);
    console.log("Account " + consumer2 + " is now a consumer");
    // special carrier accounts
    await contract.connect(admin).registerIndustry(ups);
    console.log("Account " + ups + " is now an industry")
    await contract.connect(admin).registerIndustry(airfrance);
    console.log("Account " + airfrance + " is now an industry")
  });
task("issueTestTokens", "Create some test issued tokens")
  .addParam("contract", "The CLM8 contract")
  .addParam("count", "Number of token to issue in each loop")
  .setAction(async (taskArgs, hre) => {
    const { dealer7, dealer1, dealer2, consumer1, consumer2 } = await hre.getNamedAccounts();

    const n = parseInt(taskArgs.count);
    if (n < 1) {
      console.error('Number of token should be greater than 0')
      return;
    }
    const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
    const contract = NetEmissionsTokenNetwork.attach(taskArgs.contract);
    for (let i = 1; i<n+1; i++) {
      const qty = i * 100;
      await contract
      .connect(await hre.ethers.getSigner(dealer1))
      .issue(
        dealer1,
        consumer1,
        1,
        qty,
        "1607463809",
        "1607463809",
        "",
        "",
        "Test token description " + i
      );
      console.log("Account " + consumer1 + " received " + qty + " tokens from " + dealer1);
      await contract
      .connect(await hre.ethers.getSigner(dealer7))
      .issue(
        dealer7,
        consumer2,
        2,
        qty,
        "1607463809",
        "1607463809",
        "",
        "",
        "Test token description " + i
      );
      console.log("Account " + consumer2 + " received " + qty + " tokens from " + dealer7);
      await contract
      .connect(await hre.ethers.getSigner(dealer2))
      .issue(
        dealer2,
        consumer2,
        3,
        qty,
        "1607463809",
        "1607463809",
        "",
        "",
        "Test token description " + i
      );
      console.log("Account " + consumer1 + " received " + qty + " tokens from " + dealer2);
    }
  });
task("createTestProposal", "Create a test proposal using the default account roles for testing")
  .addParam("governor", "The Governor contract")
  .addParam("contract", "The CLM8 contract")
  .setAction(async (taskArgs, hre) => {
    const { dealer1, dealer2 } = await hre.getNamedAccounts();

    const [admin] = await hre.ethers.getSigners();
    const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
    const contract = NetEmissionsTokenNetwork.attach(taskArgs.contract);
    const Governor = await hre.ethers.getContractFactory("Governor");
    const govContract = Governor.attach(taskArgs.governor);

    const calldatas = [
      encodeParameters(new hre.ethers.utils.AbiCoder(),
        // types of params
        ["address","uint160","uint8","uint256","uint256","uint256","string","string","string",],
        // value of params
        [
          dealer2, // account
          dealer1, // proposer
          1, // tokenTypeId
          50, // qty
          0, // fromDate
          0, // thruDate
          "some metadata",
          "a manifest",
          "some action inside a test proposal",
        ]
      ),
    ];

    await govContract.connect(admin).propose(
      [contract.address], // targets
      [0], // values
      ["issueOnBehalf(address,uint160,uint8,uint256,uint256,uint256,string,string,string)",], // signatures
      calldatas,
      "a test proposal"
    );
  });
task("createTestMultiProposal", "Create a test multi proposal using the default account roles for testing")
  .addParam("governor", "The Governor contract")
  .addParam("contract", "The CLM8 contract")
  .addOptionalParam("children", "The number of children to add, defaults to 3", 3, types.int)
  .setAction(async (taskArgs, hre) => {
    const { dealer1, dealer2 } = await hre.getNamedAccounts();

    const [admin] = await hre.ethers.getSigners();
    const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
    const contract = NetEmissionsTokenNetwork.attach(taskArgs.contract);
    const Governor = await hre.ethers.getContractFactory("Governor");
    const govContract = Governor.attach(taskArgs.governor);

    const calldatas = [
      encodeParameters(new hre.ethers.utils.AbiCoder(),
        // types of params
        ["address","uint160","uint8","uint256","uint256","uint256","string","string","string",],
        // value of params
        [
          dealer2, // account
          dealer1, // proposer
          1, // tokenTypeId
          50, // qty
          0, // fromDate
          0, // thruDate
          "some metadata",
          "a manifest",
          "some action inside a test proposal",
        ]
      ),
    ];

    const targets = [contract.address];
    const values = [0];
    const signatures = [
      "issueOnBehalf(address,uint160,uint8,uint256,uint256,uint256,string,string,string)",
    ];
    const descriptions = ["a test proposal"];
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
  .setAction(async (taskArgs, hre) => {
    const {dealer1, dealer2, dealer3, consumer1, consumer2} = await hre.getNamedAccounts();

    const [admin] = await hre.ethers.getSigners();
    const daoToken = await hre.ethers.getContractFactory("DAOToken");
    const contract = daoToken.attach(taskArgs.contract);

    const decimals = hre.ethers.BigNumber.from("1000000000000000000");
    const tokens = hre.ethers.BigNumber.from("500000");
    const i = tokens.mul(decimals);

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
  .setAction(async (taskArgs, hre) => {
    const {deployer, dealer1, dealer2, dealer3, consumer1, consumer2} = await hre.getNamedAccounts();

    const [admin] = await hre.ethers.getSigners();
    const daoToken = await hre.ethers.getContractFactory("DAOToken");
    const contract = daoToken.attach(taskArgs.contract);

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
  .setAction(async (taskArgs, hre) => {
    const [admin] = await hre.ethers.getSigners();
    const daoToken = await hre.ethers.getContractFactory("DAOToken");
    const contract = daoToken.attach(taskArgs.contract);

    const supply = await contract.connect(admin).getTotalSupply();
    console.log("Total supply is (dCLM8): " + supply);
  });
task("addToSupply", "Add a given amount to the total supply of DAO tokens")
  .addParam("contract", "The dCLM8 token")
  .addParam("amount", "The number of dCLM8 token to add")
  .setAction(async (taskArgs, hre) => {
    if (!taskArgs.amount || taskArgs.amount == "0") {
      console.log("Please specify the amount to add.");
      return;
    }

    const [admin] = await hre.ethers.getSigners();
    const daoToken = await hre.ethers.getContractFactory("DAOToken");
    const contract = daoToken.attach(taskArgs.contract);
    console.log(`Adding ${taskArgs.amount} to the Total supply`);
    await contract.connect(admin).addToTotalSupply(taskArgs.amount.toString());

    const supply = await contract.connect(admin).getTotalSupply();
    console.log("Total supply is (dCLM8): " + supply);
  });

task("completeTimelockAdminSwitch", "Complete a Timelock admin switch for a live DAO contract")
  .addParam("timelock", "")
  .addParam("governor", "")
  .addParam("target", "")
  .addParam("value", "")
  .addParam("signature", "")
  .addParam("data", "")
  .addParam("eta", "")
  .setAction(async (taskArgs, hre) => {
    const Timelock = await hre.ethers.getContractFactory("Timelock");
    const timelock = Timelock.attach(taskArgs.timelock);
    const Governor = await hre.ethers.getContractFactory("Governor");
    const governor = Governor.attach(taskArgs.governor);

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

task("issueOilAndGasTrackers", "Create C-NFT for tracking oil and gas sector emissions")
  .addParam("contract", "The CLM8 contract")
  //.addParam("trackerContract", "The C-NFT contract")
  //.addParam("count", "Number of token to issue in each loop")
  .setAction(async (taskArgs, hre) => {
    const { dealer2, industry1, industry2, industry3, industry4, industry5, industry6 } = await hre.getNamedAccounts();

    const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
    const CarbonTracker = await hre.ethers.getContractFactory("CarbonTracker");
    const contract = await NetEmissionsTokenNetwork.attach(taskArgs.contract);
    const {get} = hre.deployments;
    let carbonTracker = await get("CarbonTracker");
    const trackerContract = await CarbonTracker.attach(carbonTracker.address);

    let locations = ['Bakken','Niobrara','Permian','U.S. Average','World Average'];
    let industryAddresses = [industry1,industry2,industry3,industry5,industry6];
    // methane emission O&G in Kg
    let ventingEmissions = [42359667456,4878701472,33035904000,405270000000,2160000000000];
    let flaringEmissions = [3172353757,164659360,7191612033,24798016000,302743508000];
    let oilAmounts = [60597652,32449236,218507495,822827823,4378031482];
    let gasAmounts = [22036430,48818206,149034246,815448153,3451977203];
    let oilUnitAmounts = [60597652,32449236,218507495,822827823,4378031482];
    let gasUnitAmounts = [25623756,56765356,173295635,948195526,4013926980,];
    let productTransfer = [860000,860000,860000]
    for (let i = 0; i<locations.length; i++) {
      await contract.connect(await hre.ethers.getSigner(dealer2))
      .issueAndTrack(
        dealer2,
        industryAddresses[i],
        carbonTracker.address,
        0,
        4,
        ventingEmissions[i],
        "1577836800",
        "1609415999",
        JSON.stringify({"type": "CH4", "scope": "1", "location":  locations[i], "GWP": "30"}),
        "https://docs.google.com/spreadsheets/d/1PQ2qz-P9qing_3F3BmvH6g2LA1G9BdYe/edit#gid=689160760",
        "Methane venting and leakage"
      );
      console.log("Methane venting and leakage tokens issued for "+locations[i]);
      await contract.connect(await hre.ethers.getSigner(dealer2))
      .issueAndTrack(
        dealer2,
        industryAddresses[i],
        carbonTracker.address,
        i+1,
        4,
        flaringEmissions[i],
        "1577836800",
        "1609415999",
        JSON.stringify({"type": "CO2", "scope": "1", "location":  locations[i]}),
        "https://docs.google.com/spreadsheets/d/1PQ2qz-P9qing_3F3BmvH6g2LA1G9BdYe/edit#gid=689160760",
        "Methane flaring"
      );
      console.log("Gas flaring tokens issued for "+locations[i]);
      await trackerContract.connect(await hre.ethers.getSigner(dealer2))
      .trackUpdate(
        i+1,
        [],
        [],
        0,
        0,
        locations[i]+" oil and gas emissions"
      );
      await trackerContract.connect(await hre.ethers.getSigner(dealer2))
      .productsUpdate(
        i+1,
        [0,0],
        [oilAmounts[i],gasAmounts[i]],
        ['Oil','Natural Gas'],
        ['toe', 'kcm'],
        [oilUnitAmounts[i],gasUnitAmounts[i]]
      );
      console.log("Oil and gas products added to tracker id "+(i+1).toString()+" for "+locations[i]);

      await trackerContract.connect(await hre.ethers.getSigner(dealer2)).audit(i+1);
      console.log("Tracker id "+(i+1).toString()+" verified");
      if(i<3){
        await trackerContract.connect(await hre.ethers.getSigner(industryAddresses[i]))
          .transferProduct((i+1)*2,productTransfer[i],i+1,industry4);
        console.log("Transfer Gas (productId = "+(i+1).toString()+") from "+locations[i+1]+" to Natural Gas Utility: "+industry4);
      }
    }
  });

task("grantAdminRole", "Grants an account the DEFAULT_ADMIN_ROLE for a given contract")
  .addParam("contract", "")
  .addParam("newAdmin", "")
  .setAction(async (taskArgs, hre) => {
    const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
    const netEmissionsTokenNetwork = NetEmissionsTokenNetwork.attach(taskArgs.contract);

    await netEmissionsTokenNetwork.grantRole(
      hre.ethers.constants.HashZero,
      taskArgs.newAdmin,
    );
    console.log(`Executed grantRole() on ${taskArgs.contract}. Done.`);
  });

  task("roles", "Prints the keccak256 hashed roles for the NetEmissionsTokenNetwork contract")
  .setAction(async (taskArgs, hre) => {
    console.log(`DEFAULT_ADMIN_ROLE: ${hre.ethers.constants.HashZero}`);
    console.log(`REGISTERED_DEALER: ${hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("REGISTERED_DEALER"))}`);
    console.log(`REGISTERED_REC_DEALER: ${hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("REGISTERED_REC_DEALER"))}`);
    console.log(`REGISTERED_OFFSET_DEALER: ${hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("REGISTERED_OFFSET_DEALER"))}`);
    console.log(`REGISTERED_EMISSIONS_AUDITOR: ${hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("REGISTERED_EMISSIONS_AUDITOR"))}`);
    console.log(`REGISTERED_CONSUMER: ${hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("REGISTERED_CONSUMER"))}`);
    console.log(`REGISTERED_INDUSTRY: ${hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("REGISTERED_INDUSTRY"))}`);
  });

  task("verify-all", "Verifies all contacts for a given network on Etherscan")
  .setAction(async (taskArgs, hre) => {
    const { get } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    const daoToken = await get("DAOToken");
    const timelock = await get("Timelock");
    const governor = await get("Governor");
    const netEmissionsTokenNetwork = await get("NetEmissionsTokenNetwork");

    await hre.run("etherscan-verify", [
      daoToken.address,
      deployer
    ]);
    
    await hre.run("etherscan-verify", [
      timelock.address,
      deployer,
      172800
    ]);

    await hre.run("etherscan-verify", [
      governor.address,
      timelock.address,
      daoToken.address,
      deployer
    ]);

    await hre.run("etherscan-verify", [
      netEmissionsTokenNetwork.address,
      deployer
    ]);
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
    dealer5: { default: 5 },
    dealer6: { default: 6 },
    dealer7: { default: 7 },
    ups: { default: 8 },
    airfrance: { default: 9 },
    consumer1: { default: 19 },
    consumer2: { default: 18 },
    industry1: { default: 15 },
    industry2: { default: 16 },
    industry3: { default: 17 },
    industry4: { default: 14 },
    industry5: { default: 13 },
    industry6: { default: 12 },
    investor1: { default: 11 },

    unregistered: { default: 8 }
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

    // Uncomment the following lines if deploying contract to Avalanche testnet
    // "avalanche-testnet": {
    //   url: "https://api.avax-test.network/ext/bc/C/rpc",
    //   chainId: 43113,
    //   accounts: [`0x${ethereumConfig.AVALANCHE_PRIVATE_KEY}`]
    // },
    // Deploy with npx hardhat --network avalanche-testnet deploy --reset

    // Uncomment the following lines if deploying contract to Avalanche
    // avalanche: {
    //   url: "https://api.avax.network/ext/bc/C/rpc",
    //   chainId: 43114,
    //   accounts: [`0x${ethereumConfig.AVALANCHE_PRIVATE_KEY}`],
    //   gasPrice: 225000000000,
    // },
    // Deploy with npx hardhat --network avalanche deploy --reset

    // Uncomment the following lines if deploying contract to Binance BSC testnet
    //bsctestnet: {
    //  url: "https://data-seed-prebsc-1-s1.binance.org:8545",
    //  chainId: 97,
    //  gasPrice: 20000000000,
    //  accounts: [`0x${ethereumConfig.BSC_PRIVATE_KEY}`]
    //}
    // Deploy with npx hardhat --network bsctestnet deploy --reset

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
  paths: {
    sources: "./solidity",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  ovm: {
    solcVersion: '0.7.6'
  }
};


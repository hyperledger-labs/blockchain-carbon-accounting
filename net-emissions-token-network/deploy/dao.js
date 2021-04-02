// SPDX-License-Identifier: Apache-2.0
const {
  hoursToSeconds,
  advanceHours,
  advanceBlocks,
  encodeParameters
} = require("../test/common");

module.exports = async ({
  deployments,
  getNamedAccounts
}) => {
  const {deploy, execute} = deployments;
  const {deployer} = await getNamedAccounts();

  console.log(`Deploying DAO with account: ${deployer}`);

  let timelock = await deploy('Timelock', {
    from: deployer,
    args: [
      deployer, // initial admin
      172800 // default time delay (2 days)
    ],
  });
  console.log("Timelock deployed to:", timelock.address);

  let daoToken = await deploy('DAOToken', {
    from: deployer,
    args: [
      deployer // inital token holder
    ],
  });
  console.log("DAO Token deployed to:", daoToken.address);

  let governor = await deploy('Governor', {
    from: deployer,
    args: [
      timelock.address, // address of timelock
      daoToken.address, // address of DAO token
      deployer // guardian of governor
    ],
  });
  console.log("Governor deployed to:", governor.address);

  // set governor on DAOToken contract (for permission to burn tokens)
  try {
    await execute(
      'DAOToken',
      { from: deployer },
      'setGovernor',
      governor.address
    );
    console.log("Initialized Governor address on DAOToken.")
  } catch (e) {
    console.log("Skipped setGovernor() on DAOToken.");
  }

  // format transactions for Timelock to change admin to Governor
  let timelockNewAdmin;
  try {
    let currentTime = (await ethers.provider.getBlock(ethers.provider.getBlockNumber())).timestamp;
    timelockNewAdmin = {
      target: timelock.address,
      value: 0,
      signature: "setPendingAdmin(address)",
      data: encodeParameters(
        ['address'],[governor.address]
      ),
      eta: (currentTime + hoursToSeconds(50))
    }
    await execute(
      'Timelock',
      { from: deployer },
      'queueTransaction',
      timelockNewAdmin.target,
      timelockNewAdmin.value,
      timelockNewAdmin.signature,
      timelockNewAdmin.data,
      timelockNewAdmin.eta
    );
    console.log("Queued setPendingAdmin() on Timelock.");

  } catch (e) {
    console.log("Skipped changing admin on Governor to Timelock.")
  }

  // perform time/block skip if local network to switch timelock admin automatically
  if (!hre.network.live) {

    await advanceHours(51);

    // execute setPendingAdmin on Timelock
    await execute(
      'Timelock',
      { from: deployer  },
      'executeTransaction',
      timelockNewAdmin.target,
      timelockNewAdmin.value,
      timelockNewAdmin.signature,
      timelockNewAdmin.data,
      timelockNewAdmin.eta
    );
    console.log("Executed setPendingAdmin() on Timelock.");
    await advanceBlocks(1);

    // accept admin role from Governor contract
    await execute(
      'Governor',
      { from: deployer },
      '__acceptAdmin'
      
    );
    await advanceBlocks(1);

    console.log("Called __acceptAdmin() on Governor.");

    // delegate owner voting power to self
    await execute(
      'DAOToken',
      { from: deployer },
      'delegate',
      deployer
    );
    console.log("Delegated voting power of deployer to self.")
    
    console.log("Done performing Timelock admin switch.");
    
  // otherwise, output args to complete the timelock admin switch
  } else {
    if (timelockNewAdmin) {
      console.log("---");
      console.log("Please copy these values and call executeTransaction() on Timelock");
      console.log("when the ETA is reached from the deployer address with these args:");
      console.log("");
      console.log(`target : ${timelockNewAdmin.target}`);
      console.log(`value : ${timelockNewAdmin.value}`);
      console.log(`signature : ${timelockNewAdmin.signature}`);
      console.log(`data : ${timelockNewAdmin.data}`);
      console.log(`eta : ${timelockNewAdmin.eta}`);
      console.log("");
      console.log("Afterwards, do not forget to call __acceptAdmin() on Governor to");
      console.log("complete the admin switch.");
    }
  }

};

module.exports.tags = ['DAO'];

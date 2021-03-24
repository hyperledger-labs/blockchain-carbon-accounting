// SPDX-License-Identifier: Apache-2.0

// helper functions
hoursToSeconds = function (hours) {
  return (hours * 60 * 60);
}
encodeParameters = function (types, values) {
  let abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

module.exports = async ({
  deployments,
  getNamedAccounts
}) => {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  console.log(`Deploying DAO with account: ${deployer}`);

  let timelock = await deploy('Timelock', {
    from: deployer,
    gasLimit: 4500000,
    args: [
      deployer, // initial admin
      172800 // default time delay (2 days)
    ],
  });

  let daoToken = await deploy('DAOToken', {
    from: deployer,
    gasLimit: 4500000,
    args: [
      deployer // inital token holder
    ],
  });

  let governor = await deploy('Governor', {
    from: deployer,
    gasLimit: 4500000,
    args: [
      timelock.address, // address of timelock
      daoToken.address, // address of DAO token
      deployer // guardian of governor
    ],
  });

  console.log("Timelock deployed to:", timelock.address);
  console.log("DAO Token deployed to:", daoToken.address);
  console.log("Governor deployed to:", governor.address);

  // // format transactions for Timelock to change admin to Governor
  // let currentTime = Math.floor(Date.now() / 1000);
  // let timelockNewAdmin = {
  //   //address target, uint value, string memory signature, bytes memory data, uint eta
  //   target: timelock.address,
  //   value: 0,
  //   signature: "setPendingAdmin(address)",
  //   data: encodeParameters(
  //     ['address'],[governor.address]
  //   ),
  //   eta: (currentTime + hoursToSeconds(50))
  // }
  // await timelock.connect(deployer).queueTransaction(
  //   timelockNewAdmin.target,
  //   timelockNewAdmin.value,
  //   timelockNewAdmin.signature,
  //   timelockNewAdmin.data,
  //   timelockNewAdmin.eta
  // );
  // console.log("Queued setPendingAdmin() on Timelock.");

  // console.log("---");
  // console.log("Please copy these values and call executeTransaction() on Timelock");
  // console.log("when the ETA is reached from the deployer address with these args:");
  // console.log("");
  // console.log(`target : ${timelockNewAdmin.target}`);
  // console.log(`value : ${timelockNewAdmin.value}`);
  // console.log(`signature : ${timelockNewAdmin.signature}`);
  // console.log(`data : ${timelockNewAdmin.data}`);
  // console.log(`eta : ${timelockNewAdmin.eta}`);
  // console.log("");
  // console.log("Afterwards, do not forget to call __acceptAdmin() on Governor to");
  // console.log("complete the admin switch.");

};

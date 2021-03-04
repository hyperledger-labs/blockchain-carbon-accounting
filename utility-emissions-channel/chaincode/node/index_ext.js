const shim = require('fabric-shim');
const emissionscontract = require('./lib/emissionscontract.js');

class EmissionsChaincode extends shim.ChaincodeInterface  {
  async Init(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    console.info('=========== Instantiated Emissions Chaincode ===========');
    return shim.success();
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    console.info('=========== Invoke Emissions Chaincode ===========');
    let method = this[ret.fcn];
    if (!method) {
      console.log('no method of name:' + ret.fcn + ' found');
      return shim.success();
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }
}

const server = shim.server(new EmissionsChaincode(), {
  ccid: process.env.CHAINCODE_CCID,
  address: process.env.CHAINCODE_ADDRESS
});

server.start();



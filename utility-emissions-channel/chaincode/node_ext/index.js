const shim = require('fabric-shim');
const EmissionsRecordContract = require('./lib/emissionscontract.js');

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
      console.log('No method of name:' + ret.fcn + ' found');
      throw new Error('No method of name:' + ret.fcn + ' found');
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async recordEmissions(stub, args, thisClass) {
    console.info('recordEmissions, args:', args);
    if (!args.length) {
        throw new Error('Empty args');
    }

    let fields = ['utilityId', 'partyId', 'fromDate', 'thruDate', 'energyUseAmount', 'energyUseUom', 'url', 'md5'];
    let fieldsMap = {};
    fieldsMap.utilityId = null;
    fieldsMap.partyId = null;
    fieldsMap.fromDate = null;
    fieldsMap.thruDate = null;
    fieldsMap.energyUseAmount = null;
    fieldsMap.energyUseUom = null;
    fieldsMap.url = null;
    fieldsMap.md5 = null;

    let fieldsLen = Math.min(args.length, fields.length);
    for (let i=0; i<fieldsLen; i++) {
        fieldsMap[fields[i]] = args[i];
    }

    let erc = new EmissionsRecordContract(stub);
    let emissionsRecord = await erc.recordEmissions(fieldsMap.utilityId,
        fieldsMap.partyId,
        fieldsMap.fromDate,
        fieldsMap.thruDate,
        fieldsMap.energyUseAmount,
        fieldsMap.energyUseUom,
        fieldsMap.url,
        fieldsMap.md5);

    return emissionsRecord;
  }

  async updateEmissionsRecord(stub, args, thisClass) {
    console.info('updateEmissionsRecord, args:', args);
    if (!args.length) {
        throw new Error('Empty args');
    }

    let fields = ['uuid', 'utilityId', 'partyId', 'fromDate'];
    fields.push('thruDate');
    fields.push('emissionsAmount');
    fields.push('renewable_energy_use_amount');
    fields.push('nonrenewable_energy_use_amount');
    fields.push('energyUseUom');
    fields.push('factor_source');
    fields.push('url');
    fields.push('md5');
    fields.push('tokenId');

    let fieldsMap = {};
    fieldsMap.uuid = null;
    fieldsMap.utilityId = null;
    fieldsMap.partyId = null;
    fieldsMap.fromDate = null;
    fieldsMap.thruDate = null;
    fieldsMap.emissionsAmount = null;
    fieldsMap.renewable_energy_use_amount = null;
    fieldsMap.nonrenewable_energy_use_amount = null;
    fieldsMap.energyUseUom = null;
    fieldsMap.factor_source = null;
    fieldsMap.url = null;
    fieldsMap.md5 = null;
    fieldsMap.tokenId = null;

    let fieldsLen = Math.min(args.length, fields.length);
    for (let i=0; i<fieldsLen; i++) {
        fieldsMap[fields[i]] = args[i];
    }

    let erc = new EmissionsRecordContract(stub);
    let emissionsRecord = await erc.updateEmissionsRecord(
        fieldsMap.uuid,
        fieldsMap.utilityId,
        fieldsMap.partyId,
        fieldsMap.fromDate,
        fieldsMap.thruDate,
        fieldsMap.emissionsAmount,
        fieldsMap.renewable_energy_use_amount,
        fieldsMap.nonrenewable_energy_use_amount,
        fieldsMap.energyUseUom,
        fieldsMap.factor_source,
        fieldsMap.url,
        fieldsMap.md5,
        fieldsMap.tokenId);

    return emissionsRecord;
  }

  async getEmissionsData(stub, args, thisClass) {
    console.info('getEmissionsData, args:', args);
    if (!args.length) {
        throw new Error('Empty args');
    }

    let erc = new EmissionsRecordContract(stub);
    let emissionsRecord = await erc.getEmissionsData(args[0]);

    return emissionsRecord;
  }

  async getAllEmissionsData(stub, args, thisClass) {
    console.info('getAllEmissionsData, args:', args);
    if (!args.length) {
        throw new Error('Empty args');
    } else if (args.length != 2) {
        throw new Error('getAllEmissionsData requeres 2 arguments');
    }

    let erc = new EmissionsRecordContract(stub);
    let emissionsRecord = await erc.getAllEmissionsData(args[0], args[1]);

    return emissionsRecord;
  }

  async getAllEmissionsDataByDateRange(stub, args, thisClass) {
    console.info('getAllEmissionsDataByDateRange, args:', args);
    if (!args.length) {
        throw new Error('Empty args');
    } else if (args.length != 2) {
        throw new Error('getAllEmissionsDataByDateRange requeres 2 arguments');
    }

    let erc = new EmissionsRecordContract(stub);
    let emissionsRecord = await erc.getAllEmissionsDataByDateRange(args[0], args[1]);

    return emissionsRecord;
  }

  async getAllEmissionsDataByDateRangeAndParty(stub, args, thisClass) {
    console.info('getAllEmissionsDataByDateRangeAndParty, args:', args);
    if (!args.length) {
        throw new Error('Empty args');
    } else if (args.length != 3) {
        throw new Error('getAllEmissionsDataByDateRangeAndParty requeres 3 arguments');
    }

    let erc = new EmissionsRecordContract(stub);
    let emissionsRecord = await erc.getAllEmissionsDataByDateRangeAndParty(args[0], args[1], args[1]);

    return emissionsRecord;
  }

  async importUtilityFactor(stub, args, thisClass) {
    console.info('importUtilityFactor, args:', args);
    if (!args.length) {
        throw new Error('Empty args');
    }

    let fields = ['uuid', 'year', 'country', 'division_type'];
    fields.push('division_id');
    fields.push('division_name');
    fields.push('net_generation');
    fields.push('net_generation_uom');
    fields.push('co2_equivalent_emissions');
    fields.push('co2_equivalent_emissions_uom');
    fields.push('source');
    fields.push('non_renewables');
    fields.push('renewables');
    fields.push('percent_of_renewables');

    let fieldsMap = {};
    fieldsMap.uuid = null;
    fieldsMap.year = null;
    fieldsMap.country = null;
    fieldsMap.division_type = null;
    fieldsMap.division_id = null;
    fieldsMap.division_name = null;
    fieldsMap.net_generation = null;
    fieldsMap.net_generation_uom = null;
    fieldsMap.co2_equivalent_emissions = null;
    fieldsMap.co2_equivalent_emissions_uom = null;
    fieldsMap.source = null;
    fieldsMap.non_renewables = null;
    fieldsMap.renewables = null;
    fieldsMap.percent_of_renewables = null;

    let fieldsLen = Math.min(args.length, fields.length);
    for (let i=0; i<fieldsLen; i++) {
        fieldsMap[fields[i]] = args[i];
    }

    let erc = new EmissionsRecordContract(stub);

    let utilityFactor = await erc.importUtilityFactor(
        fieldsMap.uuid,
        fieldsMap.year,
        fieldsMap.country,
        fieldsMap.division_type,
        fieldsMap.division_id,
        fieldsMap.division_name,
        fieldsMap.net_generation,
        fieldsMap.net_generation_uom,
        fieldsMap.co2_equivalent_emissions,
        fieldsMap.co2_equivalent_emissions_uom,
        fieldsMap.source,
        fieldsMap.non_renewables,
        fieldsMap.renewables,
        fieldsMap.percent_of_renewables);

    return utilityFactor;
  }

  async updateUtilityFactor(stub, args, thisClass) {
    console.info('updateUtilityFactor, args:', args);
    if (!args.length) {
        throw new Error('Empty args');
    }

    let fields = ['uuid', 'year', 'country', 'division_type'];
    fields.push('division_id');
    fields.push('division_name');
    fields.push('net_generation');
    fields.push('net_generation_uom');
    fields.push('co2_equivalent_emissions');
    fields.push('co2_equivalent_emissions_uom');
    fields.push('source');
    fields.push('non_renewables');
    fields.push('renewables');
    fields.push('percent_of_renewables');

    let fieldsMap = {};
    fieldsMap.uuid = null;
    fieldsMap.year = null;
    fieldsMap.country = null;
    fieldsMap.division_type = null;
    fieldsMap.division_id = null;
    fieldsMap.division_name = null;
    fieldsMap.net_generation = null;
    fieldsMap.net_generation_uom = null;
    fieldsMap.co2_equivalent_emissions = null;
    fieldsMap.co2_equivalent_emissions_uom = null;
    fieldsMap.source = null;
    fieldsMap.non_renewables = null;
    fieldsMap.renewables = null;
    fieldsMap.percent_of_renewables = null;

    let fieldsLen = Math.min(args.length, fields.length);
    for (let i=0; i<fieldsLen; i++) {
        fieldsMap[fields[i]] = args[i];
    }

    let erc = new EmissionsRecordContract(stub);

    let utilityFactor = await erc.updateUtilityFactor(
        fieldsMap.uuid,
        fieldsMap.year,
        fieldsMap.country,
        fieldsMap.division_type,
        fieldsMap.division_id,
        fieldsMap.division_name,
        fieldsMap.net_generation,
        fieldsMap.net_generation_uom,
        fieldsMap.co2_equivalent_emissions,
        fieldsMap.co2_equivalent_emissions_uom,
        fieldsMap.source,
        fieldsMap.non_renewables,
        fieldsMap.renewables,
        fieldsMap.percent_of_renewables);

    return utilityFactor;
  }

  async getUtilityFactor(stub, args, thisClass) {
    console.info('getUtilityFactor, args:', args);
    if (!args.length) {
        throw new Error('Empty args');
    }

    let erc = new EmissionsRecordContract(stub);
    let utilityFactor = await erc.getUtilityFactor(args[0]);

    return utilityFactor;
  }

  async importUtilityIdentifier(stub, args, thisClass) {
    console.info('importUtilityIdentifier, args:', args);
    if (!args.length) {
        throw new Error('Empty args');
    }
    let fields = ['uuid', 'year', 'utility_number', 'utility_name', 'country', 'state_province', 'divisions']
    let fieldsMap = {};
    fieldsMap.uuid = null;
    fieldsMap.year = null;
    fieldsMap.utility_number = null;
    fieldsMap.utility_name = null;
    fieldsMap.country = null;
    fieldsMap.state_province = null;
    fieldsMap.divisions = null;
    let fieldsLen = Math.min(args.length, fields.length);
    for (let i=0; i<fieldsLen; i++) {
        fieldsMap[fields[i]] = args[i];
    }

    let erc = new EmissionsRecordContract(stub);
    let utilityIdentifier = await erc.importUtilityIdentifier(
        fieldsMap.uuid,
        fieldsMap.year,
        fieldsMap.utility_number,
        fieldsMap.utility_name,
        fieldsMap.country,
        fieldsMap.state_province,
        fieldsMap.divisions);

    return utilityIdentifier;
  }

  async updateUtilityIdentifier(stub, args, thisClass) {
    console.info('updateUtilityIdentifier, args:', args);
    if (!args.length) {
        throw new Error('Empty args');
    }
    let fields = ['uuid', 'year', 'utility_number', 'utility_name', 'country', 'state_province', 'divisions']
    let fieldsMap = {};
    fieldsMap.uuid = null;
    fieldsMap.year = null;
    fieldsMap.utility_number = null;
    fieldsMap.utility_name = null;
    fieldsMap.country = null;
    fieldsMap.state_province = null;
    fieldsMap.divisions = null;
    let fieldsLen = Math.min(args.length, fields.length);
    for (let i=0; i<fieldsLen; i++) {
        fieldsMap[fields[i]] = args[i];
    }

    let erc = new EmissionsRecordContract(stub);
    let utilityIdentifier = await erc.updateUtilityIdentifier(
        fieldsMap.uuid,
        fieldsMap.year,
        fieldsMap.utility_number,
        fieldsMap.utility_name,
        fieldsMap.country,
        fieldsMap.state_province,
        fieldsMap.divisions);

    return utilityIdentifier;
  }

  async getUtilityIdentifier(stub, args, thisClass) {
    console.info('getUtilityIdentifier, args:', args);
    if (!args.length) {
        throw new Error('Empty args');
    }

    let erc = new EmissionsRecordContract(stub);
    let utilityIdentifier = await erc.getUtilityIdentifier(args[0]);

    return utilityIdentifier;
  }

  async getAllUtilityIdentifiers(stub, args, thisClass) {
    console.info('getAllUtilityIdentifiers, args:', args);

    let erc = new EmissionsRecordContract(stub);
    let utilityIdentifiers = await erc.getAllUtilityIdentifiers();

    return utilityIdentifiers;
  }

}

const server = shim.server(new EmissionsChaincode(), {
  ccid: process.env.CHAINCODE_CCID,
  address: process.env.CHAINCODE_ADDRESS
});

server.start();


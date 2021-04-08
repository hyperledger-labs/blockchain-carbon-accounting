import {
  ChaincodeResponse,
  ChaincodeServerOpts,
  ChaincodeStub,
  Shim,
} from 'fabric-shim';

import { EmissionsRecordContract } from './lib/emissionsRecordContract';
import {
  DivisionsInterface,
  UtilityLookupItemInterface,
} from './lib/utilityLookupItem';
import {
  ErrInvalidArgument,
  ErrInvalidNumberOfArgument,
  ErrMethodNotSupported,
  MsgSuccess,
} from './util/const';
import { logger, stringToBytes } from './util/util';

class EmissionsChaincode {
  private methods: {
    [key: string]: (
      stub: ChaincodeStub,
      args: string[]
    ) => Promise<ChaincodeResponse>;
  } = {
    importUtilityIdentifier: this.importUtilityIdentifier,
    updateUtilityIdentifier: this.updateUtilityIdentifier,
    getUtilityIdentifier: this.getUtilityIdentifier,
    getAllUtilityIdentifiers: this.getAllUtilityIdentifiers,
  };
  async Init(stub: ChaincodeStub): Promise<ChaincodeResponse> {
    return Shim.success(null);
  }
  async Invoke(stub: ChaincodeStub): Promise<ChaincodeResponse> {
    const { fcn, params } = stub.getFunctionAndParameters();
    const method = this.methods[fcn];
    if (!method) {
      logger.error(`${ErrMethodNotSupported} : ${fcn} is not supported`);
      return Shim.error(
        new TextEncoder().encode(
          `${ErrMethodNotSupported} : ${fcn} is not supported`
        )
      );
    }
    return await method(stub, params);
  }
  /**
   * @param args : ['uuid', 'year', 'utility_number', 'utility_name', 'country', 'state_province', '{"division_type" : "","division_id" : ""}']
   */
  async importUtilityIdentifier(
    stub: ChaincodeStub,
    args: string[]
  ): Promise<ChaincodeResponse> {
    logger.info(`importUtilityIdentifier method called with args : ${args}`);
    // uuid is required for importing utility identifer
    if (args.length < 1) {
      logger.error(
        `${ErrInvalidNumberOfArgument} : importUtilityIdentifier method requires at-least 1 argument, but got ${args.length}`
      );
      return Shim.error(
        stringToBytes(
          `${ErrInvalidNumberOfArgument} : importUtilityIdentifier method requires at-least 1 argument, but got ${args.length}`
        )
      );
    }
    const fields = [
      'uuid',
      'year',
      'utility_number',
      'utility_name',
      'country',
      'state_province',
      'divisions',
    ];
    const min = Math.min(args.length, fields.length);
    const identifier: UtilityLookupItemInterface = { uuid: args[0] };
    for (let i = 1; i < min; i++) {
      identifier[fields[i]] = args[i];
    }
    // division exists
    if (args.length === 7) {
      delete identifier.divisions;
      const divisionJSON = JSON.parse(args[6]);
      let division: DivisionsInterface;
      if (divisionJSON.division_type && divisionJSON.division_id) {
        division = {
          division_id: divisionJSON.division_id,
          division_type: divisionJSON.division_type,
        };
      } else {
        logger.error(
          `${ErrInvalidArgument} : invalid division , got : ${args[6]}`
        );
        return Shim.error(
          stringToBytes(
            `${ErrInvalidArgument} : division should represented by : '{"division_type" : "","division_id" : ""}`
          )
        );
      }
      identifier.divisions = division;
    }
    let byte: Uint8Array;
    try {
      byte = await new EmissionsRecordContract(stub).importUtilityIdentifier(
        identifier
      );
    } catch (error) {
      logger.error(error);
      return Shim.error(stringToBytes((error as Error).message));
    }
    logger.debug(
      `${MsgSuccess} importUtilityIdentifier success ${byte.toString()}`
    );
    return Shim.success(byte);
  }
  /**
   * @param args : ['uuid', 'year', 'utility_number', 'utility_name', 'country', 'state_province', '{"division_type" : "","division_id" : ""}']
   */
  async updateUtilityIdentifier(
    stub: ChaincodeStub,
    args: string[]
  ): Promise<ChaincodeResponse> {
    logger.info(`updateUtilityIdentifier method called with args : ${args}`);
    // uuid is required for importing utility identifer
    if (args.length < 1) {
      logger.error(
        `${ErrInvalidNumberOfArgument} : updateUtilityIdentifier method requires at-least 1 argument, but got ${args.length}`
      );
      return Shim.error(
        stringToBytes(
          `${ErrInvalidNumberOfArgument} : updateUtilityIdentifier method requires at-least 1 argument, but got ${args.length}`
        )
      );
    }
    const fields = [
      'uuid',
      'year',
      'utility_number',
      'utility_name',
      'country',
      'state_province',
      'divisions',
    ];
    const min = Math.min(args.length, fields.length);
    const identifier: UtilityLookupItemInterface = { uuid: args[0] };
    for (let i = 1; i < min; i++) {
      identifier[fields[i]] = args[i];
    }
    // division exists
    if (args.length === 7) {
      delete identifier.divisions;
      const divisionJSON = JSON.parse(args[6]);
      let division: DivisionsInterface;
      if (divisionJSON.division_type && divisionJSON.division_id) {
        division = {
          division_id: divisionJSON.division_id,
          division_type: divisionJSON.division_type,
        };
      } else {
        logger.error(
          `${ErrInvalidArgument} : invalid division , got : ${args[6]}`
        );
        return Shim.error(
          stringToBytes(
            `${ErrInvalidArgument} : division should represented by : '{"division_type" : "","division_id" : ""}`
          )
        );
      }
      identifier.divisions = division;
    }
    let byte: Uint8Array;
    try {
      byte = await new EmissionsRecordContract(stub).updateUtilityIdentifier(
        identifier
      );
    } catch (error) {
      logger.error(error);
      return Shim.error(stringToBytes((error as Error).message));
    }
    logger.debug(
      `${MsgSuccess} updateUtilityIdentifier success ${byte.toString()}`
    );
    return Shim.success(byte);
  }

  /**
   * @param args : ['uuid']
   */
  async getUtilityIdentifier(
    stub: ChaincodeStub,
    args: string[]
  ): Promise<ChaincodeResponse> {
    logger.info(`getUtilityIdentifier method called with args : ${args}`);
    if (args.length !== 1) {
      logger.error(
        `${ErrInvalidNumberOfArgument} : getUtilityIdentifier requires 1 arg , but provided ${args.length}`
      );
      return Shim.error(
        stringToBytes(
          `${ErrInvalidNumberOfArgument} : getUtilityIdentifier requires 1 arg , but provided ${args.length}`
        )
      );
    }
    let byte: Uint8Array;
    try {
      byte = await new EmissionsRecordContract(stub).getUtilityIdentifier(
        args[0]
      );
    } catch (error) {
      logger.error(error);
      return Shim.error(stringToBytes((error as Error).message));
    }
    logger.debug(
      `${MsgSuccess} getUtilityIdentifier success ${byte.toString()}`
    );
    return Shim.success(byte);
  }

  async getAllUtilityIdentifiers(
    stub: ChaincodeStub,
    args: string[]
  ): Promise<ChaincodeResponse> {
    let byte: Uint8Array;
    try {
      byte = await new EmissionsRecordContract(stub).getAllUtilityIdentifiers();
    } catch (error) {
      logger.error(error);
      return Shim.error(stringToBytes((error as Error).message));
    }
    return Shim.success(byte);
  }
}

const ccServerOpt: ChaincodeServerOpts = {
  ccid: process.env.CHAINCODE_CCID,
  address: process.env.CHAINCODE_ADDRESS,
  tlsProps: null,
};

const ccServer = Shim.server(new EmissionsChaincode(), ccServerOpt);

ccServer.start().then(() => {
  console.log(
    `CC_SERVER : CC_ID = ${ccServerOpt.ccid} Started on ${ccServerOpt.address}`
  );
});

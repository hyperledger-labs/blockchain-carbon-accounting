import { ChaincodeResponse, ChaincodeStub, Shim } from 'fabric-shim';
import { EmissionsRecordInterface } from './lib/emissions';
import { EmissionsRecordContract } from './lib/emissionsRecordContract';
import {
    ErrInvalidArgument,
    ErrInvalidNumberOfArgument,
    ErrMethodNotSupported,
    MsgSuccess,
} from './util/const';
import { logger, stringToBytes } from './util/util';

class EmissionsChaincode {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private methods: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        [key: string]: (stub: ChaincodeStub, args: string[]) => Promise<ChaincodeResponse>;
    } = {
        updateEmissionsMintedToken: this.updateEmissionsMintedToken,
        recordEmissions: this.recordEmissions,
        updateEmissionsRecord: this.updateEmissionsRecord,
        getEmissionsData: this.getEmissionsData,
        getAllEmissionsData: this.getAllEmissionsData,
        getAllEmissionsDataByDateRange: this.getAllEmissionsDataByDateRange,
        getAllEmissionsDataByDateRangeAndParty: this.getAllEmissionsDataByDateRangeAndParty,

        // for lockdata
        getValidEmissions: this.getValidEmissions,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async Init(_stub: ChaincodeStub): Promise<ChaincodeResponse> {
        return Shim.success(undefined);
    }
    async Invoke(stub: ChaincodeStub): Promise<ChaincodeResponse> {
        const { fcn, params } = stub.getFunctionAndParameters();
        const method = this.methods[fcn];
        if (!method) {
            logger.error(`${ErrMethodNotSupported} : ${fcn} is not supported`);
            return Shim.error(
                new TextEncoder().encode(`${ErrMethodNotSupported} : ${fcn} is not supported`),
            );
        }
        return await method(stub, params);
    }
    async recordEmissions(stub: ChaincodeStub, args: string[]): Promise<ChaincodeResponse> {
        logger.info(`recordEmissions method called with args : ${args}`);
        const fields = [
            'endpoint',
            'query',
            'queryParams',
            //'utilityId',
            'partyId',
            'fromDate',
            'thruDate',
            //'energyUseAmount',
            //'energyUseUom',
            'url',
            'md5',
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fieldsMap: Record<string, any> = {
            endpoint: null,
            query: null,
            queryParams: null,
            //utilityId: null,
            partyId: null,
            fromDate: null,
            thruDate: null,
            //energyUseAmount: null,
            //energyUseUom: null,
            url: null,
        };
        const fieldsLen = Math.min(args.length, fields.length);
        for (let i = 0; i < fieldsLen; i++) {
            fieldsMap[fields[i]] = args[i];
        }
        let byte: Uint8Array;
        try {
            byte = await new EmissionsRecordContract(stub).recordEmissions(
                fieldsMap.endpoint,
                fieldsMap.query,
                fieldsMap.queryParams,
                fieldsMap.partyId,
                fieldsMap.fromDate,
                fieldsMap.thruDate,
                //fieldsMap.energyUseAmount,
                //fieldsMap.energyUseUom,
                fieldsMap.url,
                fieldsMap.md5,
            );
        } catch (error) {
            console.log(error);
            return Shim.error(stringToBytes((error as Error).message));
        }
        logger.debug(`${MsgSuccess} recordEmissions success ${byte.toString()}`);
        return Shim.success(byte);
    }

    async updateEmissionsRecord(stub: ChaincodeStub, args: string[]): Promise<ChaincodeResponse> {
        const fields: (keyof EmissionsRecordInterface)[] = [
            'uuid',
            'utilityId',
            'partyId',
            'fromDate',
            'thruDate',
            'emissionsAmount',
            'renewableEnergyUseAmount',
            'nonrenewableEnergyUseAmount',
            'energyUseUom',
            'factorSource',
            'url',
            'md5',
            'tokenId',
        ];
        const numberFields: (keyof EmissionsRecordInterface)[] = [
            'emissionsAmount',
            'renewableEnergyUseAmount',
            'nonrenewableEnergyUseAmount',
        ];
        let recordI: EmissionsRecordInterface = {};
        const fieldsLen = Math.min(args.length, fields.length);
        for (let i = 0; i < fieldsLen; i++) {
            const v = args[i];
            if (numberFields.indexOf(fields[i]) > -1) {
                recordI = { ...recordI, [fields[i]]: Number(v) };
            } else {
                recordI = { ...recordI, [fields[i]]: v };
            }
        }
        let byte: Uint8Array;
        try {
            byte = await new EmissionsRecordContract(stub).updateEmissionsRecord(recordI);
        } catch (error) {
            logger.error(error);
            return Shim.error(stringToBytes((error as Error).message));
        }
        return Shim.success(byte);
    }
    /**
     * @description will update emissions record(s) with minted token
     * @param args client input
     *      - args[0] : tokenId:string
     *      - args[1...] : uuids:Array<string>
     */
    async updateEmissionsMintedToken(
        stub: ChaincodeStub,
        args: string[],
    ): Promise<ChaincodeResponse> {
        logger.info(`updateEmissionsMintedToken method will args : ${args}`);
        if (args.length < 3) {
            logger.error(
                `${ErrInvalidArgument} : updateEmissionsMintedToken requires 3 or more args, but provided ${args.length}`,
            );
            return Shim.error(
                stringToBytes(
                    `${ErrInvalidArgument} : updateEmissionsMintedToken requires 3 or more args, but provided ${args.length}`,
                ),
            );
        }
        const tokenId = args[0];
        const partyId = args[1];
        const uuids = args.slice(2);
        try {
            const out = await new EmissionsRecordContract(stub).updateEmissionsMintedToken(
                tokenId,
                partyId,
                uuids,
            );
            return Shim.success(out);
        } catch (error) {
            logger.error(error);
            return Shim.error(stringToBytes((error as Error).message));
        }
    }
    async getEmissionsData(stub: ChaincodeStub, args: string[]): Promise<ChaincodeResponse> {
        logger.info(`getEmissionsData method called with args : ${args}`);
        if (args.length !== 1) {
            logger.error(
                `${ErrInvalidNumberOfArgument} : getEmissionsData requires 1 arg , but provided ${args.length}`,
            );
            return Shim.error(
                stringToBytes(
                    `${ErrInvalidNumberOfArgument} : getEmissionsData requires 1 arg , but provided ${args.length}`,
                ),
            );
        }
        let byte: Uint8Array;
        try {
            byte = await new EmissionsRecordContract(stub).getEmissionsData(args[0]);
        } catch (error) {
            logger.error(error);
            return Shim.error(stringToBytes((error as Error).message));
        }
        return Shim.success(byte);
    }

    async getValidEmissions(stub: ChaincodeStub, args: string[]): Promise<ChaincodeResponse> {
        logger.info(`getValidEmissions method called with args : ${args}`);
        let byte: Uint8Array;
        try {
            byte = await new EmissionsRecordContract(stub).getValidEmissions(args);
            return Shim.success(byte);
        } catch (error) {
            logger.error(error);
            return Shim.error(stringToBytes((error as Error).message));
        }
    }
    async getAllEmissionsData(stub: ChaincodeStub, args: string[]): Promise<ChaincodeResponse> {
        logger.info(`getAllEmissionsData method called with args : ${args}`);
        if (args.length !== 2) {
            logger.error(
                `${ErrInvalidNumberOfArgument} : getAllEmissionsData requires 2 arg , but provided ${args.length}`,
            );
            return Shim.error(
                stringToBytes(
                    `${ErrInvalidNumberOfArgument} : getAllEmissionsData requires 2 arg , but provided ${args.length}`,
                ),
            );
        }
        let byte: Uint8Array;
        try {
            byte = await new EmissionsRecordContract(stub).getAllEmissionsData(args[0], args[1]);
        } catch (error) {
            logger.error(error);
            return Shim.error(stringToBytes((error as Error).message));
        }
        return Shim.success(byte);
    }
    async getAllEmissionsDataByDateRange(
        stub: ChaincodeStub,
        args: string[],
    ): Promise<ChaincodeResponse> {
        logger.info(`getAllEmissionsDataByDateRange method called with args : ${args}`);
        if (args.length !== 2) {
            logger.error(
                `${ErrInvalidNumberOfArgument} : getAllEmissionsDataByDateRange requires 2 arg , but provided ${args.length}`,
            );
            return Shim.error(
                stringToBytes(
                    `${ErrInvalidNumberOfArgument} : getAllEmissionsDataByDateRange requires 2 arg , but provided ${args.length}`,
                ),
            );
        }
        let byte: Uint8Array;
        try {
            byte = await new EmissionsRecordContract(stub).getAllEmissionsDataByDateRange(
                args[0],
                args[1],
            );
        } catch (error) {
            logger.error(error);
            return Shim.error(stringToBytes((error as Error).message));
        }
        return Shim.success(byte);
    }
    async getAllEmissionsDataByDateRangeAndParty(
        stub: ChaincodeStub,
        args: string[],
    ): Promise<ChaincodeResponse> {
        logger.info(`getAllEmissionsDataByDateRangeAndParty method called with args : ${args}`);
        if (args.length !== 3) {
            logger.error(
                `${ErrInvalidNumberOfArgument} : getAllEmissionsDataByDateRangeAndParty requires 3 arg , but provided ${args.length}`,
            );
            return Shim.error(
                stringToBytes(
                    `${ErrInvalidNumberOfArgument} : getAllEmissionsDataByDateRangeAndParty requires 3 arg , but provided ${args.length}`,
                ),
            );
        }
        let byte: Uint8Array;
        try {
            byte = await new EmissionsRecordContract(stub).getAllEmissionsDataByDateRangeAndParty(
                args[0],
                args[1],
                args[2],
            );
        } catch (error) {
            logger.error(error);
            return Shim.error(stringToBytes((error as Error).message));
        }
        return Shim.success(byte);
    }
}

Shim.start(new EmissionsChaincode());

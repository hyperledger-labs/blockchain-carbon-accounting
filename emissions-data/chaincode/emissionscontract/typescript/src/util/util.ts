import { Shim } from 'fabric-shim';

interface ILogger {
    error: (message: unknown) => void;
    info: (message: string) => void;
    debug: (message: string) => void;
}

// logger : provide global logger for logging
export const logger: ILogger = Shim.newLogger('EMISSION_RECORD_CHAINCODE');

const encoder = new TextEncoder();

export const stringToBytes = (msg: string): Uint8Array => {
    return encoder.encode(msg);
};

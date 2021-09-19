import { Logger, LoggerProvider, LogLevelDesc } from '@hyperledger/cactus-common';
export let appLogger: Logger;
export let ledgerLogger: Logger;

export function setup(appLevel: string, ledgerLevel: string): void {
    appLogger = LoggerProvider.getOrCreate({
        label: 'APPLICATION',
        level: appLevel as LogLevelDesc,
    });
    ledgerLogger = LoggerProvider.getOrCreate({
        label: 'LEDGER',
        level: ledgerLevel as LogLevelDesc,
    });
}

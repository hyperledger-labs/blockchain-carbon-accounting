import winston, { Logger } from 'winston';

export let log: Logger;

const appName = 'VAULT_IDENTITY';

export function setup(level: string): void {
    log = winston
        .createLogger({
            level: level,
            format: winston.format.json(),
            transports: [new winston.transports.Console()],
        })
        .child({ app: appName });
}

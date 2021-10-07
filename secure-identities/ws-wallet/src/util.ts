// utility

import winston, { Logger } from 'winston'

// Options : extended by each *Options interfaces defined this repo
export interface Options {
  logLevel: 'debug' | 'info' | 'error';
}

export class Util {
  static getClassLogger (logLevel: string, className): Logger {
    const log = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.splat(),
        winston.format.timestamp(),
        winston.format.label({ label: 'SECURE-FABRIC' }),
        winston.format.colorize({
          message: true,
          colors: {
            debug: 'cyan',
            info: 'green',
            warn: 'yellow',
            error: 'red'
          }
        }),
        winston.format.printf((info) => {
          return `[ ${info.label} ] [ ${info.level.toUpperCase()} ] ${
            info.class
          }::${info.fnTag}() : ${info.message}`
        })
      ),
      transports: [new winston.transports.Console()]
    })
    return log.child({ class: className })
  }

  static getMethodLogger (classLogger: Logger, fnTag: string): Logger {
    return classLogger.child({ fnTag: fnTag })
  }

  static isEmptyString (candidate: string) {
    return candidate === undefined || candidate.length === 0
  }
}

#!/usr/bin/env node
import utils from './utils';

const yargs = require('yargs');

yargs.usage(utils.usage)
  .option('k', {
    alias: 'keys',
    describe: 'List all key names',
    type: 'boolean',
    demandOption: false,
  })
  .option('p', {
    alias: 'pass',
    describe: 'password that encrypts PKCS#8 key file',
    type: 'string',
  })
  .option('s', {
    alias: 'sslStrict',
    describe: 'set sslStrict to false for testing with unverified ssl/tls certificates',
    type: 'boolean',
  })
  .help(true).argv;

if (yargs.argv.k) {
  console.log(utils.listKeys().join('\n'));
} else if (yargs.argv._[0] === 'new-key') {
  const res = utils.keyGen({ keyName: yargs.argv._[1], password: yargs.argv.p, curve: yargs.argv._[2] });
  console.log(res);
} else if (yargs.argv._[0] === 'get-pkh') {
  console.log(utils.getPubKeyHex({keyName: yargs.argv._[1]}));
} else if (yargs.argv._[0] === 'open'){
  (async () => {
    const resp = await utils.newSession(
      yargs.argv._[1],
      yargs.argv._[2],
      yargs.argv.p,
      eval(yargs.argv.ssl)
    )
    console.log(JSON.stringify(resp))
  })()
} else if (yargs.argv._[0] === 'connect') {
  (async () => {
    const resp = await utils.openSession(
      yargs.argv._[1], 
      yargs.argv._[2], 
      yargs.argv._[3],
      yargs.argv.p,
      eval(yargs.argv.ssl)
    );
    console.log(resp)
  })()
} else {
  utils.showHelp();
}

export {};
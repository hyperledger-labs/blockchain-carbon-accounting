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
  .help(true).argv;

if (yargs.argv.k) {
  console.log(utils.listKeys().join('\n'));
} else if (yargs.argv._[0] === 'new-key') {
  utils.generateKey({ keyName: yargs.argv._[1], curve: yargs.argv._[2] });
} else if (yargs.argv._[0] === 'get-pkh') {
  console.log(utils.getPubKeyHex({keyName: yargs.argv._[1]}));
} else if (yargs.argv._[0] === 'open'){
  (async () => {
    const resp = await utils.newSession(
      yargs.argv._[1],
      yargs.argv._[2],
      eval(yargs.argv._[3])
    )
    console.log(JSON.stringify(resp))
  })()
} else if (yargs.argv._[0] === 'connect') {
  (async () => {
    const resp = await utils.openSession(
      yargs.argv._[1], 
      yargs.argv._[2], 
      yargs.argv._[3],
      eval(yargs.argv._[4])
    );
    console.log(resp)
  })()
} else {
  utils.showHelp();
}

export {};
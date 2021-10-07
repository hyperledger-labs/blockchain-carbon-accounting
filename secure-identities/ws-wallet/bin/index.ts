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
  console.log(utils.getPubKeyHex(yargs.argv._[1]));
} else if (yargs.argv._[0] === 'connect') {
  utils.getClient(
    yargs.argv._[1], 
    {keyName: yargs.argv._[2]},
    eval(yargs.argv._[3])
  );
} else {
  utils.showHelp();
}
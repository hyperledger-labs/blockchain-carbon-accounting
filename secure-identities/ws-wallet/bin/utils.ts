import { WsWallet } from '../src/wallet';
import { keyGen, getPubKeyHex, listKeys, IClientNewKey } from '../src/key';

let usage = '\nUsage: ws-wallet\n';
usage +=
  '\tnew-key <keyname> [<curve>]\t' +
  "\tGenerate new key with curve: 'p256' | 'p384'\n";
usage += '\tget-pkh <keyname>\t' + '\t\tGet publick key hex of keyname\n';
usage += '\tconnect <host> <keyname> [<sslStrict>] \t' + 'Connect to ws-identity server\n'; 
usage += '...      \t \t \t use sslStric for testing with unverified ssl/tls certificates\n';

function showHelp() {
  console.log(usage);
  console.log('\nOptions:\r');
  console.log(
    '   \t--version\t' + 'Show version number.' + '\t\t' + '[boolean]\r',
  );
  console.log(
    '-k,\t--keys   \t' + 'List all keys.      ' + '\t\t' + '[boolean]\r',
  );
  console.log(
    '   \t--help   \t' + 'Show help.          ' + '\t\t' + '[boolean]\n',
  );
}

async function getClient(endpoint,args: IClientNewKey,strictSSL?:boolean) {
  const wsClient = new WsWallet({ endpoint, keyName: args.keyName, strictSSL});
  const key = await wsClient.open();
  console.log(key);
}

async function generateKey(args: IClientNewKey) {
  const res = keyGen(args);
  console.log(res);
}

export default {
  usage,
  showHelp,
  getClient,
  generateKey,
  getPubKeyHex,
  listKeys,
};

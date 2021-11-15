
import { keyGen, getPubKeyHex, listKeys, newSession, openSession } from '../src/util';

let usage = '\nUsage: ws-wallet\n';
usage +=
  '\tnew-key <keyname> [<curve>]\t' + "\tGenerate new key with curve: 'p256' | 'p384'\n";
usage += '\tget-pkh <keyname>\t' + '\t\tGet public key hex of keyname\n';
usage += '\topen <endpoint> <keyname> \t\t' + 'Open ws-identity session from endpoint with keyname encrypted by password\n'; 

usage += '\tconnect <host> <sessionId> <keyname> \t' + 'Connect to ws-identity server\n'; 

function showHelp() {
  console.log(usage);
  console.log('\nOptions:\r');

  console.log(
    '-k,\t--keys   \t' + 'List all keys.      ' + '\t\t' + '[boolean]\r',
  );
  console.log(
    '   \t--help   \t' + 'Show help.          ' + '\t\t' + '[boolean]\r',
  );
  console.log(
    '   \t--version\t' + 'Show version number.' + '\t\t' + '[boolean]\n',
  );
  console.log(
    '-p,\t--pass   \t' + 'Provide passphrase for key encryption.' + '\t\t' + '[string]\r',
  );
  console.log(
    '-ssl,\t--sslStrict \t' + 'Set sslStrict to false for testing.' + '\t\t' + '[boolean]\n',
  );
}

export default {
  usage,
  showHelp,
  newSession,
  openSession,
  keyGen,
  getPubKeyHex,
  listKeys,
};

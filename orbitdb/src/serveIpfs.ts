import IPFS = require('ipfs')
import { ipfsOptions } from './config'


async function main()
{
  // Create IPFS instance
  console.log('=== Starting IPFS')
  const ipfs = await IPFS.create(ipfsOptions)
  ipfs.libp2p.connectionManager.on('peer:connect', (info) => {
    console.log('peer:connect',info);
  });
  ipfs.libp2p.connectionManager.on('peer:disconnect', (info) => {
    console.log('peer:disconnect',info);
  });

    console.log('IPFS Started ... (press CTRL-C to stop)');
}
main()

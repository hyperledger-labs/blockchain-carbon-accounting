import IPFS = require('ipfs')
import type { OrbitDB as ODB } from 'orbit-db'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const OrbitDB = require('orbit-db')
import { SingleBar, Presets } from 'cli-progress';
import { orbitDbFullPath, orbitDbDirectory, ipfsOptions } from './config'
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

async function main()
{
  const argv = yargs(hideBin(process.argv))
    .option('serve', {
      alias: 's',
      type: 'boolean',
      description: 'Keep the node running',
    })
    .recommendCommands()
    .showHelpOnFail(true).argv;

  // Create IPFS instance
  console.log('=== Starting IPFS')
  const ipfs = await IPFS.create(ipfsOptions)

  // Create OrbitDB
  console.log('=== Starting OrbitDB')
  const orbitdb: ODB = await OrbitDB.createInstance(ipfs,{directory: orbitDbDirectory})
  const db = await orbitdb.docstore(orbitDbFullPath)
  const progressBar = new SingleBar(
    {
      format:
      'Replicating into OrbitDB |' +
        '{bar}' +
        '| {percentage}% | ETA: {eta}s | {value}/{total} records',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      etaBuffer: 50,
      etaAsynchronousUpdate: true,
    },
    Presets.shades_classic,
  )
  let barStarted = false;

  const done = async () => {
    if (barStarted) progressBar.stop();
    console.log('Done');
    if (!barStarted) console.log('=== OrbitDB was already up-to-date.')
    else console.log('=== OrbitDB replication complete.')

    if (argv['s']) {
      console.log('OrbitDB Started ... (press CTRL-C to stop)')
    } else {
      console.log('=== Closing OrbitDB ...')
      await db.close()
      console.log('=== Stopping IPFS, or press CTRL-C to terminate. ...')
      try {
        await ipfs.stop()
      } catch (err) {
        console.error('== Error stopping IPFS, should not matter.', err)
      }
      console.log('=== All stopped')
    }

  }

  console.log('=== Making existing OrbitDB replica')
  db.events.on('ready', (dbname) => {
    console.log('Connected to OrbitDB: ', dbname)
  });
  db.events.on('load', async (dbname) => {
    console.log('Loaded OrbitDB: ', dbname)
    done();
  });
  db.events.on('replicate.progress', (_address, _hash, _entry, progress, have) => {
    if (!barStarted) {
      console.log('Starting replication...')
      progressBar.start(have, progress)
      barStarted = true
    } else {
      progressBar.update(progress)
    }
  });
  db.events.on('replicated', () => {
    done();
  });
  await db.load()
}
main()
